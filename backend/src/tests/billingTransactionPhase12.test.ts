import assert from 'assert';
import prisma from '../db/index.js';
import { BillingPreviewService } from '../modules/billing/services/billing-preview.service.js';
import { SettlementService } from '../modules/billing/services/settlement.service.js';

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

async function cleanupTestCustomer(customerId: string) {
  await prisma.billingIdempotencyKey.deleteMany({
    where: { settlement: { customerId } },
  });
  await prisma.settlementAuditLog.deleteMany({ where: { customerId } });
  await prisma.settlementLedgerEntry.deleteMany({ where: { customerId } });
  await prisma.advanceTransaction.deleteMany({
    where: { advance: { customerId } },
  });
  await prisma.settlementAdvanceAllocation.deleteMany({
    where: { settlement: { customerId } },
  });
  await prisma.settlementFeedAllocation.deleteMany({
    where: { settlement: { customerId } },
  });
  await prisma.settlementMilkEntry.deleteMany({
    where: { settlement: { customerId } },
  });
  await prisma.billSettlement.deleteMany({ where: { customerId } });
  await prisma.billingPreviewRecord.deleteMany({ where: { customerId } });
  await prisma.milkEntry.deleteMany({ where: { customerId } });
  await prisma.foodSale.deleteMany({ where: { customerId } });
  await prisma.advance.deleteMany({ where: { customerId } });
  await prisma.customer.deleteMany({ where: { id: customerId } });
}

async function run() {
  console.log('================================================================================');
  console.log('SMART DAIRY — PHASE 12: TRANSACTION & CONCURRENCY TEST SUITE');
  console.log('================================================================================\n');

  const admin = await prisma.admin.findFirst({
    where: { OR: [{ mobile: '8767537562' }, { mobile: '+918767537562' }] },
  });
  assert(admin, 'Target test dairy admin 8767537562 must exist');

  const otherAdmin = await prisma.admin.findFirst({
    where: { id: { not: admin.id } },
  });

  const foodPurchase = await prisma.foodPurchase.findFirst({
    where: { adminId: admin.id },
  });
  assert(foodPurchase, 'At least one FoodPurchase must exist for test dairy');

  await prisma.customer.deleteMany({ where: { adminId: admin.id, code: 99913 } });
  const farmer = await prisma.customer.create({
    data: {
      adminId: admin.id,
      code: 99913,
      name: 'Phase12 Transaction Farmer',
      mobile: '9999999913',
      milkType: 'COW',
      isActive: true,
    },
  });

  try {
    const d1 = new Date('2025-05-05T06:00:00.000Z');
    await prisma.milkEntry.create({
      data: {
        customerId: farmer.id,
        date: d1,
        shift: 'MORNING',
        milkType: 'COW',
        quantity: 100,
        fat: 4.0,
        snf: 8.5,
        rate: 50,
        totalAmount: 5000,
        isReversed: false,
        isSettled: false,
      },
    });
    await prisma.foodSale.create({
      data: {
        adminId: admin.id,
        customerId: farmer.id,
        foodPurchaseId: foodPurchase.id,
        foodName: foodPurchase.foodName,
        quantity: 2,
        sellRate: 1000,
        totalAmount: 2000,
        amountPaid: 0,
        pendingAmount: 2000,
        isCashPayment: false,
        saleDate: d1,
      },
    });
    const adv = await prisma.advance.create({
      data: {
        adminId: admin.id,
        customerId: farmer.id,
        advanceNumber: `ADV-P12-TX-${Date.now()}`,
        originalAmount: 1000,
        recoveredAmount: 0,
        pendingAmount: 1000,
        status: 'ACTIVE',
        givenDate: d1,
      },
    });
    await prisma.advanceTransaction.create({
      data: { advanceId: adv.id, type: 'ISSUED', amount: 1000, createdBy: admin.id },
    });

    const preview = await BillingPreviewService.generateBillingPreview(admin.id, {
      farmerId: farmer.id,
      cycleType: 'TEN_DAY',
      startDate: '2025-05-01',
      endDate: '2025-05-10',
    });

    const rollbackHooks: Array<
      [string, keyof NonNullable<Parameters<typeof SettlementService.finalizeSettlement>[3]>]
    > = [
      ['Rollback: Feed allocation failure rolls back entire transaction', 'onBeforeFeedAllocation'],
      ['Rollback: Advance allocation failure rolls back entire transaction', 'onBeforeAdvanceAllocation'],
      ['Rollback: Ledger insertion failure rolls back entire transaction', 'onBeforeLedger'],
    ];

    for (const [name, hook] of rollbackHooks) {
      await test(name, async () => {
        await assert.rejects(() =>
          SettlementService.finalizeSettlement(
            admin.id,
            admin.id,
            {
              previewId: preview.previewId,
              farmerId: farmer.id,
              startDate: '2025-05-01',
              endDate: '2025-05-10',
              idempotencyKey: `p12-rb-${hook}-${Date.now()}`,
            },
            {
              [hook]: () => {
                throw new Error(`Simulated failure at ${hook}`);
              },
            }
          )
        );

        const [sCount, mSettled, feedPending, advPending, ledgerCount, auditCount] =
          await Promise.all([
            prisma.billSettlement.count({ where: { customerId: farmer.id } }),
            prisma.milkEntry.count({ where: { customerId: farmer.id, isSettled: true } }),
            prisma.foodSale.aggregate({
              where: { customerId: farmer.id },
              _sum: { pendingAmount: true },
            }),
            prisma.advance.aggregate({
              where: { customerId: farmer.id },
              _sum: { pendingAmount: true },
            }),
            prisma.settlementLedgerEntry.count({ where: { customerId: farmer.id } }),
            prisma.settlementAuditLog.count({ where: { customerId: farmer.id } }),
          ]);

        assert.strictEqual(sCount, 0);
        assert.strictEqual(mSettled, 0);
        assert.strictEqual(Number(feedPending._sum.pendingAmount), 2000);
        assert.strictEqual(Number(advPending._sum.pendingAmount), 1000);
        assert.strictEqual(ledgerCount, 0);
        assert.strictEqual(auditCount, 0);
      });
    }

    await test('Stale preview: New feed sale after preview rejects finalization with 409', async () => {
      const addedSale = await prisma.foodSale.create({
        data: {
          adminId: admin.id,
          customerId: farmer.id,
          foodPurchaseId: foodPurchase.id,
          foodName: 'Late Feed',
          quantity: 1,
          sellRate: 500,
          totalAmount: 500,
          amountPaid: 0,
          pendingAmount: 500,
          isCashPayment: false,
          saleDate: d1,
        },
      });
      try {
        await assert.rejects(
          () =>
            SettlementService.finalizeSettlement(admin.id, admin.id, {
              previewId: preview.previewId,
              farmerId: farmer.id,
              startDate: '2025-05-01',
              endDate: '2025-05-10',
              idempotencyKey: `p12-stale-${Date.now()}`,
            }),
          (err: any) => err.statusCode === 409 && err.code === 'STALE_PREVIEW'
        );
        assert.strictEqual(await prisma.billSettlement.count({ where: { customerId: farmer.id } }), 0);
      } finally {
        await prisma.foodSale.delete({ where: { id: addedSale.id } });
      }
    });

    await test('Unauthorized cross-dairy action is rejected', async () => {
      if (!otherAdmin) return;
      await assert.rejects(
        () =>
          SettlementService.finalizeSettlement(otherAdmin.id, otherAdmin.id, {
            previewId: preview.previewId,
            farmerId: farmer.id,
            startDate: '2025-05-01',
            endDate: '2025-05-10',
            idempotencyKey: `p12-unauth-${Date.now()}`,
          }),
        (err: any) => err.statusCode === 404
      );
    });

    await test('Concurrency: Two simultaneous settlements allow only one to succeed', async () => {
      const idem1 = `p12-conc-a-${Date.now()}`;
      const idem2 = `p12-conc-b-${Date.now()}`;

      const results = await Promise.allSettled([
        SettlementService.finalizeSettlement(admin.id, admin.id, {
          previewId: preview.previewId,
          farmerId: farmer.id,
          startDate: '2025-05-01',
          endDate: '2025-05-10',
          idempotencyKey: idem1,
        }),
        SettlementService.finalizeSettlement(admin.id, admin.id, {
          previewId: preview.previewId,
          farmerId: farmer.id,
          startDate: '2025-05-01',
          endDate: '2025-05-10',
          idempotencyKey: idem2,
        }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');
      assert.strictEqual(fulfilled.length, 1);
      assert.strictEqual(rejected.length, 1);

      const sCount = await prisma.billSettlement.count({ where: { customerId: farmer.id } });
      assert.strictEqual(sCount, 1);

      // Duplicate idempotency replay returns the existing settlement
      const winnerKey = results[0].status === 'fulfilled' ? idem1 : idem2;
      const replay = await SettlementService.finalizeSettlement(admin.id, admin.id, {
        previewId: preview.previewId,
        farmerId: farmer.id,
        startDate: '2025-05-01',
        endDate: '2025-05-10',
        idempotencyKey: winnerKey,
      });
      assert.strictEqual(replay.settlementSummary.netPayable, '2000.00');
      assert.strictEqual(await prisma.billSettlement.count({ where: { customerId: farmer.id } }), 1);
    });
  } finally {
    await cleanupTestCustomer(farmer.id);
  }

  console.log('\n================================================================================');
  console.log(`PHASE 12 TRANSACTION TESTS: TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================================');
  if (failed > 0) process.exit(1);
}

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

