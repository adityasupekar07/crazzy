import assert from 'assert';
import prisma from '../db/index.js';
import { BillingPreviewService } from '../modules/billing/services/billing-preview.service.js';
import { SettlementService } from '../modules/billing/services/settlement.service.js';
import { SettlementHistoryService } from '../modules/billing/services/settlement-history.service.js';
import { settlementListQuerySchema } from '../modules/billing/validators/billing.schema.js';

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
  console.log('SMART DAIRY — PHASE 11: SETTLEMENT HISTORY & DETAIL TEST SUITE');
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

  await prisma.customer.deleteMany({ where: { adminId: admin.id, code: 99911 } });
  const farmer = await prisma.customer.create({
    data: {
      adminId: admin.id,
      code: 99911,
      name: 'Phase11 History Farmer',
      mobile: '9999999911',
      milkType: 'COW',
      isActive: true,
    },
  });

  try {
    const d1 = new Date('2025-03-05T06:00:00.000Z');
    await prisma.milkEntry.create({
      data: {
        customerId: farmer.id,
        date: d1,
        shift: 'MORNING',
        milkType: 'COW',
        quantity: 100,
        fat: 4.1,
        snf: 8.6,
        rate: 52.5,
        totalAmount: 5250,
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
        isActive: true,
      },
    });
    const adv = await prisma.advance.create({
      data: {
        adminId: admin.id,
        customerId: farmer.id,
        advanceNumber: `ADV-P11-${Date.now()}`,
        originalAmount: 1500,
        recoveredAmount: 0,
        pendingAmount: 1500,
        status: 'ACTIVE',
        givenDate: d1,
      },
    });
    await prisma.advanceTransaction.create({
      data: { advanceId: adv.id, type: 'ISSUED', amount: 1500, createdBy: admin.id },
    });

    const preview = await BillingPreviewService.generateBillingPreview(admin.id, {
      farmerId: farmer.id,
      cycleType: 'TEN_DAY',
      startDate: '2025-03-01',
      endDate: '2025-03-10',
    });

    const finalized = await SettlementService.finalizeSettlement(admin.id, admin.id, {
      previewId: preview.previewId,
      farmerId: farmer.id,
      startDate: '2025-03-01',
      endDate: '2025-03-10',
      idempotencyKey: `p11-settle-${Date.now()}`,
    });

    await test('List: Returns finalized settlements and supports all 4 filters + pagination', async () => {
      const byFarmer = await SettlementHistoryService.listSettlements(admin.id, {
        farmerId: farmer.id,
        status: 'FINALIZED',
        startDate: '2025-03-01',
        endDate: '2025-03-10',
        settlementReference: finalized.settlementNumber,
        page: 1,
        limit: 10,
      });

      assert.strictEqual(byFarmer.data.length, 1);
      assert.strictEqual(byFarmer.data[0].id, finalized.settlementId);
      assert.strictEqual(byFarmer.data[0].milkAmount, '5250.00');
      assert.strictEqual(byFarmer.data[0].totalDeductions, '3500.00');
      assert.strictEqual(byFarmer.data[0].netPayable, '1750.00');
      assert.strictEqual(byFarmer.pagination.total, 1);
    });

    await test('List: Cross-dairy isolation & invalid filter rejection', async () => {
      if (otherAdmin) {
        const cross = await SettlementHistoryService.listSettlements(otherAdmin.id, {
          farmerId: farmer.id,
          page: 1,
          limit: 20,
        });
        assert.strictEqual(cross.data.length, 0);
      }

      assert.throws(() =>
        settlementListQuerySchema.parse({ status: 'INVALID_STATUS', page: 0 })
      );
      await assert.rejects(
        () =>
          SettlementHistoryService.listSettlements(admin.id, {
            startDate: '2025-03-15',
            endDate: '2025-03-01',
            page: 1,
            limit: 20,
          }),
        (err: any) => err.statusCode === 400
      );
    });

    await test('Detail: Returns complete historical snapshots, allocations, summary, and metadata', async () => {
      const detail = await SettlementHistoryService.getSettlementDetail(
        admin.id,
        finalized.settlementId
      );

      assert.strictEqual(detail.settlementId, finalized.settlementId);
      assert.strictEqual(detail.settlementNumber, finalized.settlementNumber);
      assert.strictEqual(detail.farmer.id, farmer.id);
      assert.strictEqual(detail.milkCollections.length, 1);
      assert.strictEqual(detail.milkCollections[0].rate, '52.50');
      assert.strictEqual(detail.milkCollections[0].amount, '5250.00');
      assert.strictEqual(detail.feedAllocations.length, 1);
      assert.strictEqual(detail.feedAllocations[0].deductedAmount, '2000.00');
      assert.strictEqual(detail.advanceAllocations.length, 1);
      assert.strictEqual(detail.advanceAllocations[0].deductedAmount, '1500.00');
      assert.strictEqual(detail.summary.grossMilkAmount, '5250.00');
      assert.strictEqual(detail.summary.totalDeductions, '3500.00');
      assert.strictEqual(detail.summary.netPayable, '1750.00');
    });

    await test('Detail: Returns 404 for nonexistent settlement or cross-dairy access', async () => {
      await assert.rejects(
        () => SettlementHistoryService.getSettlementDetail(admin.id, 'non-existent-id'),
        (err: any) => err.statusCode === 404
      );
      if (otherAdmin) {
        await assert.rejects(
          () =>
            SettlementHistoryService.getSettlementDetail(
              otherAdmin.id,
              finalized.settlementId
            ),
          (err: any) => err.statusCode === 404
        );
      }
    });

    await test('Detail: Historical settlement remains immutable when new feed/advance records are added, and APIs are strictly read-only', async () => {
      const newFeed = await prisma.foodSale.create({
        data: {
          adminId: admin.id,
          customerId: farmer.id,
          foodPurchaseId: foodPurchase.id,
          foodName: 'Later Feed',
          quantity: 1,
          sellRate: 500,
          totalAmount: 500,
          amountPaid: 0,
          pendingAmount: 500,
          isCashPayment: false,
          saleDate: new Date('2025-03-15T06:00:00.000Z'),
        },
      });

      const beforeCounts = await Promise.all([
        prisma.billSettlement.count({ where: { customerId: farmer.id } }),
        prisma.settlementMilkEntry.count({ where: { settlementId: finalized.settlementId } }),
        prisma.settlementFeedAllocation.count({ where: { settlementId: finalized.settlementId } }),
        prisma.settlementAdvanceAllocation.count({ where: { settlementId: finalized.settlementId } }),
        prisma.settlementLedgerEntry.count({ where: { customerId: farmer.id } }),
        prisma.settlementAuditLog.count({ where: { customerId: farmer.id } }),
        prisma.foodSale.aggregate({ where: { customerId: farmer.id }, _sum: { pendingAmount: true } }),
        prisma.advance.aggregate({ where: { customerId: farmer.id }, _sum: { pendingAmount: true } }),
      ]);

      await SettlementHistoryService.listSettlements(admin.id, {
        farmerId: farmer.id,
        page: 1,
        limit: 20,
      });
      const detail = await SettlementHistoryService.getSettlementDetail(
        admin.id,
        finalized.settlementId
      );
      assert.strictEqual(detail.summary.feedDeducted, '2000.00');
      assert.strictEqual(detail.summary.netPayable, '1750.00');

      const afterCounts = await Promise.all([
        prisma.billSettlement.count({ where: { customerId: farmer.id } }),
        prisma.settlementMilkEntry.count({ where: { settlementId: finalized.settlementId } }),
        prisma.settlementFeedAllocation.count({ where: { settlementId: finalized.settlementId } }),
        prisma.settlementAdvanceAllocation.count({ where: { settlementId: finalized.settlementId } }),
        prisma.settlementLedgerEntry.count({ where: { customerId: farmer.id } }),
        prisma.settlementAuditLog.count({ where: { customerId: farmer.id } }),
        prisma.foodSale.aggregate({ where: { customerId: farmer.id }, _sum: { pendingAmount: true } }),
        prisma.advance.aggregate({ where: { customerId: farmer.id }, _sum: { pendingAmount: true } }),
      ]);

      assert.deepStrictEqual(afterCounts, beforeCounts);
      await prisma.foodSale.delete({ where: { id: newFeed.id } });
    });
  } finally {
    await cleanupTestCustomer(farmer.id);
  }

  console.log('\n================================================================================');
  console.log(`PHASE 11 TEST RESULTS: TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
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

