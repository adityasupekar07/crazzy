import assert from 'assert';
import crypto from 'crypto';
import prisma from '../db/index.js';
import { BillingPreviewService } from '../modules/billing/services/billing-preview.service.js';
import { SettlementService } from '../modules/billing/services/settlement.service.js';
import { AdvanceRepository } from '../modules/billing/repositories/advance.repository.js';
import { Decimal } from '../utils/decimal.js';

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
  console.log('SMART DAIRY — PHASE 9: SETTLEMENT FINALIZATION INTEGRATION TEST SUITE');
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

  // Helper to create an isolated test farmer
  const createFarmer = async (code: number, name: string) => {
    await prisma.customer.deleteMany({ where: { adminId: admin.id, code } });
    return prisma.customer.create({
      data: {
        adminId: admin.id,
        code,
        name,
        mobile: `99999${String(code).padStart(5, '0')}`.slice(0, 10),
        milkType: 'COW',
        isActive: true,
      },
    });
  };

  // Use past dates so allowFuturePeriods: false passes
  const d1 = new Date('2025-01-05T06:00:00.000Z');
  const d2 = new Date('2025-01-06T06:00:00.000Z');
  const startDate = '2025-01-01';
  const endDate = '2025-01-10';

  // ── Scenario Group A: Full happy path + idempotency + overlap + advance double-count + cross-dairy
  const f1 = await createFarmer(99901, 'Phase9 Happy Farmer');
  try {
    await prisma.milkEntry.createMany({
      data: [
        {
          customerId: f1.id,
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
        {
          customerId: f1.id,
          date: d2,
          shift: 'EVENING',
          milkType: 'COW',
          quantity: 100,
          fat: 4.2,
          snf: 8.6,
          rate: 50,
          totalAmount: 5000,
          isReversed: false,
          isSettled: false,
        },
        // 9: Reversed milk collection must be excluded
        {
          customerId: f1.id,
          date: d2,
          shift: 'MORNING',
          milkType: 'COW',
          quantity: 50,
          fat: 4.0,
          snf: 8.5,
          rate: 50,
          totalAmount: 2500,
          isReversed: true,
          isSettled: false,
        },
      ],
    });

    const sale1 = await prisma.foodSale.create({
      data: {
        adminId: admin.id,
        customerId: f1.id,
        foodPurchaseId: foodPurchase.id,
        foodName: foodPurchase.foodName,
        quantity: 2,
        sellRate: 1500,
        totalAmount: 3000,
        amountPaid: 0,
        pendingAmount: 3000,
        isCashPayment: false,
        saleDate: d1,
      },
    });

    const adv1 = await prisma.advance.create({
      data: {
        adminId: admin.id,
        customerId: f1.id,
        advanceNumber: `ADV-P9-${Date.now()}`,
        originalAmount: 2000,
        recoveredAmount: 0,
        pendingAmount: 2000,
        status: 'ACTIVE',
        givenDate: d1,
      },
    });
    await prisma.advanceTransaction.create({
      data: {
        advanceId: adv1.id,
        type: 'ISSUED',
        amount: 2000,
        createdBy: admin.id,
      },
    });

    const preview1 = await BillingPreviewService.generateBillingPreview(admin.id, {
      farmerId: f1.id,
      cycleType: 'TEN_DAY',
      startDate,
      endDate,
    });

    const idemKey1 = `idem-p9-happy-${Date.now()}`;

    await test('1, 2, 9, 20, 22: Finalizes settlement atomically with feed-first order, allocations, ledger & audit', async () => {
      const res = await SettlementService.finalizeSettlement(admin.id, admin.id, {
        previewId: preview1.previewId,
        farmerId: f1.id,
        startDate,
        endDate,
        idempotencyKey: idemKey1,
      });

      assert.strictEqual(res.status, 'FINALIZED');
      assert.strictEqual(res.milkSummary.totalAmount, '10000.00');
      assert.strictEqual(res.feedSummary.deducted, '3000.00');
      assert.strictEqual(res.feedSummary.remaining, '0.00');
      assert.strictEqual(res.advanceSummary.deducted, '2000.00');
      assert.strictEqual(res.advanceSummary.remaining, '0.00');
      assert.strictEqual(res.settlementSummary.totalDeductions, '5000.00');
      assert.strictEqual(res.settlementSummary.netPayable, '5000.00');

      const dbSale = await prisma.foodSale.findUnique({ where: { id: sale1.id } });
      assert.strictEqual(Number(dbSale?.pendingAmount), 0);
      assert.strictEqual(Number(dbSale?.amountPaid), 3000);

      const dbAdv = await prisma.advance.findUnique({ where: { id: adv1.id } });
      assert.strictEqual(dbAdv?.status, 'CLOSED');
      assert.strictEqual(Number(dbAdv?.pendingAmount), 0);
      assert.strictEqual(Number(dbAdv?.recoveredAmount), 2000);

      const settledMilkCount = await prisma.milkEntry.count({
        where: { customerId: f1.id, isSettled: true },
      });
      assert.strictEqual(settledMilkCount, 2, 'Only 2 non-reversed milk entries settled');

      const audit = await prisma.settlementAuditLog.findFirst({
        where: { settlementId: res.settlementId },
      });
      assert(audit, 'Audit log must be created');

      const ledger = await prisma.settlementLedgerEntry.findUnique({
        where: { settlementId: res.settlementId },
      });
      assert(ledger, 'Settlement ledger entry must be created');
    });

    await test('11: Duplicate idempotency request returns same settlement without duplicate records', async () => {
      const beforeCount = await prisma.billSettlement.count({ where: { customerId: f1.id } });
      const replay = await SettlementService.finalizeSettlement(admin.id, admin.id, {
        previewId: preview1.previewId,
        farmerId: f1.id,
        startDate,
        endDate,
        idempotencyKey: idemKey1,
      });
      const afterCount = await prisma.billSettlement.count({ where: { customerId: f1.id } });
      assert.strictEqual(afterCount, beforeCount);
      assert.strictEqual(replay.settlementSummary.netPayable, '5000.00');
    });

    await test('12: Same idempotency key with different request throws 409 conflict', async () => {
      await assert.rejects(
        () =>
          SettlementService.finalizeSettlement(admin.id, admin.id, {
            previewId: preview1.previewId,
            farmerId: f1.id,
            startDate: '2025-01-11',
            endDate: '2025-01-20',
            idempotencyKey: idemKey1,
          }),
        (err: any) => err.statusCode === 409
      );
    });

    await test('10: Overlapping finalized settlement period is rejected', async () => {
      await assert.rejects(
        () =>
          SettlementService.finalizeSettlement(admin.id, admin.id, {
            previewId: preview1.previewId,
            farmerId: f1.id,
            startDate: '2025-01-05',
            endDate: '2025-01-15',
            idempotencyKey: `idem-overlap-${Date.now()}`,
          }),
        (err: any) => err.statusCode === 409
      );
    });

    await test('21: Advance recovery is not counted twice in advance history', async () => {
      const advHistory = await AdvanceRepository.findAdvanceHistoryForFarmer(admin.id, f1.id);
      assert.strictEqual(advHistory.summary.totalGiven, '2000.00');
      assert.strictEqual(advHistory.summary.totalRepaid, '2000.00');
      assert.strictEqual(advHistory.summary.remainingOutstanding, '0.00');
    });

    await test('14: Cross-dairy farmer access is rejected', async () => {
      if (!otherAdmin) return;
      await assert.rejects(
        () =>
          SettlementService.finalizeSettlement(otherAdmin.id, otherAdmin.id, {
            previewId: preview1.previewId,
            farmerId: f1.id,
            startDate,
            endDate,
            idempotencyKey: `idem-cross-${Date.now()}`,
          }),
        (err: any) => err.statusCode === 404
      );
    });
  } finally {
    await cleanupTestCustomer(f1.id);
  }

  // ── Scenario Group B: Feed > Milk (3, 4) & Advance > Remaining Milk (5, 6) & Zero Milk (7) & Settled Milk (8)
  const f2 = await createFarmer(99902, 'Phase9 Partial Feed Farmer');
  try {
    await prisma.milkEntry.create({
      data: {
        customerId: f2.id,
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
        customerId: f2.id,
        foodPurchaseId: foodPurchase.id,
        foodName: foodPurchase.foodName,
        quantity: 5,
        sellRate: 1400,
        totalAmount: 7000,
        amountPaid: 0,
        pendingAmount: 7000,
        isCashPayment: false,
        saleDate: d1,
      },
    });
    const adv2 = await prisma.advance.create({
      data: {
        adminId: admin.id,
        customerId: f2.id,
        advanceNumber: `ADV-P9-B-${Date.now()}`,
        originalAmount: 3000,
        recoveredAmount: 0,
        pendingAmount: 3000,
        status: 'ACTIVE',
        givenDate: d1,
      },
    });
    await prisma.advanceTransaction.create({
      data: { advanceId: adv2.id, type: 'ISSUED', amount: 3000, createdBy: admin.id },
    });

    const p2 = await BillingPreviewService.generateBillingPreview(admin.id, {
      farmerId: f2.id,
      cycleType: 'TEN_DAY',
      startDate,
      endDate,
    });

    await test('3 & 4: Feed > Milk deducts feed partially, sets advanceDeducted=0 and netPayable=0, carries forward remaining feed', async () => {
      const res = await SettlementService.finalizeSettlement(admin.id, admin.id, {
        previewId: p2.previewId,
        farmerId: f2.id,
        startDate,
        endDate,
        idempotencyKey: `idem-p9-b-${Date.now()}`,
      });
      assert.strictEqual(res.feedSummary.deducted, '5000.00');
      assert.strictEqual(res.feedSummary.remaining, '2000.00');
      assert.strictEqual(res.advanceSummary.deducted, '0.00');
      assert.strictEqual(res.advanceSummary.remaining, '3000.00');
      assert.strictEqual(res.settlementSummary.netPayable, '0.00');
    });
  } finally {
    await cleanupTestCustomer(f2.id);
  }

  const f3 = await createFarmer(99903, 'Phase9 Partial Advance Farmer');
  try {
    await prisma.milkEntry.create({
      data: {
        customerId: f3.id,
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
    const adv3 = await prisma.advance.create({
      data: {
        adminId: admin.id,
        customerId: f3.id,
        advanceNumber: `ADV-P9-C-${Date.now()}`,
        originalAmount: 8000,
        recoveredAmount: 0,
        pendingAmount: 8000,
        status: 'ACTIVE',
        givenDate: d1,
      },
    });
    await prisma.advanceTransaction.create({
      data: { advanceId: adv3.id, type: 'ISSUED', amount: 8000, createdBy: admin.id },
    });

    const p3 = await BillingPreviewService.generateBillingPreview(admin.id, {
      farmerId: f3.id,
      cycleType: 'TEN_DAY',
      startDate,
      endDate,
    });

    await test('5 & 6: Advance > Remaining Milk recovers partial advance, sets netPayable=0, carries forward remaining advance', async () => {
      const res = await SettlementService.finalizeSettlement(admin.id, admin.id, {
        previewId: p3.previewId,
        farmerId: f3.id,
        startDate,
        endDate,
        idempotencyKey: `idem-p9-c-${Date.now()}`,
      });
      assert.strictEqual(res.advanceSummary.deducted, '5000.00');
      assert.strictEqual(res.advanceSummary.remaining, '3000.00');
      assert.strictEqual(res.settlementSummary.netPayable, '0.00');

      const dbAdv = await prisma.advance.findUnique({ where: { id: adv3.id } });
      assert.strictEqual(dbAdv?.status, 'PARTIALLY_RECOVERED');
      assert.strictEqual(Number(dbAdv?.pendingAmount), 3000);
    });
  } finally {
    await cleanupTestCustomer(f3.id);
  }

  // ── Scenario Group C: Zero milk amount (7) & Already settled milk (8) & Stale preview (13) & Concurrency (15) & Rollbacks (16-19)
  const f4 = await createFarmer(99904, 'Phase9 Zero & Stale & Concurrency Farmer');
  try {
    const mZero = await prisma.milkEntry.create({
      data: {
        customerId: f4.id,
        date: d1,
        shift: 'MORNING',
        milkType: 'COW',
        quantity: 0,
        fat: 0,
        snf: 0,
        rate: 0,
        totalAmount: 0,
        isReversed: false,
        isSettled: false,
      },
    });
    const pZero = await BillingPreviewService.generateBillingPreview(admin.id, {
      farmerId: f4.id,
      cycleType: 'TEN_DAY',
      startDate,
      endDate,
    });

    await test('7: Zero milk amount settles with 0.00 deductions and 0.00 payable', async () => {
      const res = await SettlementService.finalizeSettlement(admin.id, admin.id, {
        previewId: pZero.previewId,
        farmerId: f4.id,
        startDate,
        endDate,
        idempotencyKey: `idem-zero-${Date.now()}`,
      });
      assert.strictEqual(res.settlementSummary.grossAmount, '0.00');
      assert.strictEqual(res.settlementSummary.netPayable, '0.00');
    });

    // Next period with already-settled entry only -> rejects
    await prisma.milkEntry.create({
      data: {
        customerId: f4.id,
        date: new Date('2025-01-12T06:00:00.000Z'),
        shift: 'MORNING',
        milkType: 'COW',
        quantity: 10,
        fat: 4,
        snf: 8.5,
        rate: 40,
        totalAmount: 400,
        isSettled: true,
      },
    });
    const pAlreadySettled = await BillingPreviewService.generateBillingPreview(admin.id, {
      farmerId: f4.id,
      cycleType: 'TEN_DAY',
      startDate: '2025-01-11',
      endDate: '2025-01-20',
    });

    await test('8: Rejects when only already-settled milk collections exist', async () => {
      await assert.rejects(
        () =>
          SettlementService.finalizeSettlement(admin.id, admin.id, {
            previewId: pAlreadySettled.previewId,
            farmerId: f4.id,
            startDate: '2025-01-11',
            endDate: '2025-01-20',
            idempotencyKey: `idem-settled-only-${Date.now()}`,
          }),
        (err: any) => err.statusCode === 400
      );
    });

    // Stale preview & Rollback & Concurrency on period 2025-01-21..2025-01-31
    await prisma.milkEntry.create({
      data: {
        customerId: f4.id,
        date: new Date('2025-01-22T06:00:00.000Z'),
        shift: 'MORNING',
        milkType: 'COW',
        quantity: 20,
        fat: 4,
        snf: 8.5,
        rate: 50,
        totalAmount: 1000,
        isSettled: false,
      },
    });
    await prisma.foodSale.create({
      data: {
        adminId: admin.id,
        customerId: f4.id,
        foodPurchaseId: foodPurchase.id,
        foodName: foodPurchase.foodName,
        quantity: 1,
        sellRate: 400,
        totalAmount: 400,
        amountPaid: 0,
        pendingAmount: 400,
        isCashPayment: false,
        saleDate: new Date('2025-01-22T06:00:00.000Z'),
      },
    });
    const adv4 = await prisma.advance.create({
      data: {
        adminId: admin.id,
        customerId: f4.id,
        advanceNumber: `ADV-P9-D-${Date.now()}`,
        originalAmount: 300,
        recoveredAmount: 0,
        pendingAmount: 300,
        status: 'ACTIVE',
        givenDate: new Date('2025-01-22T06:00:00.000Z'),
      },
    });
    await prisma.advanceTransaction.create({
      data: { advanceId: adv4.id, type: 'ISSUED', amount: 300, createdBy: admin.id },
    });

    const pStale = await BillingPreviewService.generateBillingPreview(admin.id, {
      farmerId: f4.id,
      cycleType: 'TEN_DAY',
      startDate: '2025-01-21',
      endDate: '2025-01-31',
    });

    await test('13: Stale preview is rejected when milk/feed/advance changes after preview', async () => {
      const added = await prisma.milkEntry.create({
        data: {
          customerId: f4.id,
          date: new Date('2025-01-23T06:00:00.000Z'),
          shift: 'EVENING',
          milkType: 'COW',
          quantity: 10,
          fat: 4,
          snf: 8.5,
          rate: 50,
          totalAmount: 500,
          isSettled: false,
        },
      });
      try {
        await assert.rejects(
          () =>
            SettlementService.finalizeSettlement(admin.id, admin.id, {
              previewId: pStale.previewId,
              farmerId: f4.id,
              startDate: '2025-01-21',
              endDate: '2025-01-31',
              idempotencyKey: `idem-stale-${Date.now()}`,
            }),
          (err: any) => err.statusCode === 409 && err.code === 'STALE_PREVIEW'
        );
      } finally {
        await prisma.milkEntry.delete({ where: { id: added.id } });
      }
    });

    const pValid4 = await BillingPreviewService.generateBillingPreview(admin.id, {
      farmerId: f4.id,
      cycleType: 'TEN_DAY',
      startDate: '2025-01-21',
      endDate: '2025-01-31',
    });

    const rollbackChecks: Array<[string, keyof NonNullable<Parameters<typeof SettlementService.finalizeSettlement>[3]>]> = [
      ['16: Feed allocation failure causes complete rollback', 'onBeforeFeedAllocation'],
      ['17: Advance allocation failure causes complete rollback', 'onBeforeAdvanceAllocation'],
      ['18: Ledger creation failure causes complete rollback', 'onBeforeLedger'],
      ['19: Audit log failure causes complete rollback', 'onBeforeAuditLog'],
    ];

    for (const [label, hookName] of rollbackChecks) {
      await test(label, async () => {
        const beforeSettlements = await prisma.billSettlement.count({ where: { customerId: f4.id } });
        const beforeUnsettledMilk = await prisma.milkEntry.count({
          where: { customerId: f4.id, isSettled: false },
        });
        const beforeFeed = await prisma.foodSale.aggregate({
          where: { customerId: f4.id },
          _sum: { pendingAmount: true },
        });
        const beforeAdv = await prisma.advance.aggregate({
          where: { customerId: f4.id },
          _sum: { pendingAmount: true },
        });

        await assert.rejects(() =>
          SettlementService.finalizeSettlement(
            admin.id,
            admin.id,
            {
              previewId: pValid4.previewId,
              farmerId: f4.id,
              startDate: '2025-01-21',
              endDate: '2025-01-31',
              idempotencyKey: `idem-rb-${hookName}-${Date.now()}`,
            },
            {
              [hookName]: () => {
                throw new Error(`Simulated failure in ${hookName}`);
              },
            }
          )
        );

        const afterSettlements = await prisma.billSettlement.count({ where: { customerId: f4.id } });
        const afterUnsettledMilk = await prisma.milkEntry.count({
          where: { customerId: f4.id, isSettled: false },
        });
        const afterFeed = await prisma.foodSale.aggregate({
          where: { customerId: f4.id },
          _sum: { pendingAmount: true },
        });
        const afterAdv = await prisma.advance.aggregate({
          where: { customerId: f4.id },
          _sum: { pendingAmount: true },
        });

        assert.strictEqual(afterSettlements, beforeSettlements);
        assert.strictEqual(afterUnsettledMilk, beforeUnsettledMilk);
        assert.strictEqual(
          Number(afterFeed._sum.pendingAmount),
          Number(beforeFeed._sum.pendingAmount)
        );
        assert.strictEqual(
          Number(afterAdv._sum.pendingAmount),
          Number(beforeAdv._sum.pendingAmount)
        );
      });
    }

    await test('15: Concurrent settlement requests for the same farmer allow only one finalization', async () => {
      const results = await Promise.allSettled([
        SettlementService.finalizeSettlement(admin.id, admin.id, {
          previewId: pValid4.previewId,
          farmerId: f4.id,
          startDate: '2025-01-21',
          endDate: '2025-01-31',
          idempotencyKey: `idem-conc-1-${Date.now()}`,
        }),
        SettlementService.finalizeSettlement(admin.id, admin.id, {
          previewId: pValid4.previewId,
          farmerId: f4.id,
          startDate: '2025-01-21',
          endDate: '2025-01-31',
          idempotencyKey: `idem-conc-2-${Date.now()}`,
        }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');
      assert.strictEqual(fulfilled.length, 1, 'Exactly one concurrent settlement must succeed');
      assert.strictEqual(rejected.length, 1, 'Second concurrent settlement must be rejected');

      const jan21Count = await prisma.billSettlement.count({
        where: {
          customerId: f4.id,
          cycleStartDate: { gte: new Date('2025-01-20T00:00:00.000Z') },
        },
      });
      assert.strictEqual(jan21Count, 1);
    });
  } finally {
    await cleanupTestCustomer(f4.id);
  }

  console.log('\n================================================================================');
  console.log(`PHASE 9 TEST RESULTS: TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
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

