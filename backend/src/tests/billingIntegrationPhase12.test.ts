import assert from 'assert';
import prisma from '../db/index.js';
import { FarmerHistoryService } from '../modules/billing/services/farmer-history.service.js';
import { BillingPreviewService } from '../modules/billing/services/billing-preview.service.js';
import { SettlementService } from '../modules/billing/services/settlement.service.js';
import { SettlementHistoryService } from '../modules/billing/services/settlement-history.service.js';
import { ReconciliationService } from '../modules/billing/services/reconciliation.service.js';

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
  console.log('SMART DAIRY — PHASE 12: END-TO-END INTEGRATION TEST SUITE');
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

  await prisma.customer.deleteMany({ where: { adminId: admin.id, code: 99912 } });
  const farmer = await prisma.customer.create({
    data: {
      adminId: admin.id,
      code: 99912,
      name: 'Phase12 Integration Farmer',
      mobile: '9999999912',
      milkType: 'COW',
      isActive: true,
    },
  });

  try {
    // Seed previous feed (2025-04-02), current milk (2025-04-12 & 2025-04-13),
    // one already-settled milk entry, current feed (2025-04-12), and advances
    await prisma.milkEntry.createMany({
      data: [
        {
          customerId: farmer.id,
          date: new Date('2025-04-12T06:00:00.000Z'),
          shift: 'MORNING',
          milkType: 'COW',
          quantity: 80,
          fat: 4.0,
          snf: 8.5,
          rate: 50,
          totalAmount: 4000,
          isReversed: false,
          isSettled: false,
        },
        {
          customerId: farmer.id,
          date: new Date('2025-04-13T06:00:00.000Z'),
          shift: 'EVENING',
          milkType: 'COW',
          quantity: 70,
          fat: 4.2,
          snf: 8.6,
          rate: 50,
          totalAmount: 3500,
          isReversed: false,
          isSettled: false,
        },
        {
          customerId: farmer.id,
          date: new Date('2025-04-14T06:00:00.000Z'),
          shift: 'MORNING',
          milkType: 'COW',
          quantity: 20,
          fat: 4.0,
          snf: 8.5,
          rate: 50,
          totalAmount: 1000,
          isReversed: false,
          isSettled: true,
        },
      ],
    });

    await prisma.foodSale.createMany({
      data: [
        {
          adminId: admin.id,
          customerId: farmer.id,
          foodPurchaseId: foodPurchase.id,
          foodName: 'Previous Feed',
          quantity: 3,
          sellRate: 1000,
          totalAmount: 3000,
          amountPaid: 0,
          pendingAmount: 3000,
          isCashPayment: false,
          saleDate: new Date('2025-04-02T06:00:00.000Z'),
        },
        {
          adminId: admin.id,
          customerId: farmer.id,
          foodPurchaseId: foodPurchase.id,
          foodName: 'Current Feed',
          quantity: 2,
          sellRate: 1000,
          totalAmount: 2000,
          amountPaid: 0,
          pendingAmount: 2000,
          isCashPayment: false,
          saleDate: new Date('2025-04-12T06:00:00.000Z'),
        },
      ],
    });

    const adv = await prisma.advance.create({
      data: {
        adminId: admin.id,
        customerId: farmer.id,
        advanceNumber: `ADV-P12-${Date.now()}`,
        originalAmount: 4000,
        recoveredAmount: 0,
        pendingAmount: 4000,
        status: 'ACTIVE',
        givenDate: new Date('2025-04-05T06:00:00.000Z'),
      },
    });
    await prisma.advanceTransaction.create({
      data: { advanceId: adv.id, type: 'ISSUED', amount: 4000, createdBy: admin.id },
    });

    await test('1-6: Farmer history loads milk, prev+current feed, advances, and excludes settled milk', async () => {
      const history = await FarmerHistoryService.getFarmerBillingHistory(
        admin.id,
        farmer.id,
        '2025-04-11',
        '2025-04-20'
      );

      assert.strictEqual(history.milkSummary.eligibleCount, 2);
      assert.strictEqual(history.milkSummary.settledCount, 1);
      assert.strictEqual(history.milkSummary.totalLitres, '150.00');
      assert.strictEqual(history.milkSummary.totalAmount, '7500.00');

      assert.strictEqual(history.feedSummary.previousOutstanding, '3000.00');
      assert.strictEqual(history.feedSummary.currentSales, '2000.00');
      assert.strictEqual(history.feedSummary.totalOutstanding, '5000.00');

      assert.strictEqual(history.advanceSummary.remainingOutstanding, '4000.00');
    });

    let previewId = '';
    await test('7 & 12: Preview & repeated previews do not modify DB records or balances', async () => {
      const before = await Promise.all([
        prisma.billSettlement.count({ where: { customerId: farmer.id } }),
        prisma.foodSale.aggregate({ where: { customerId: farmer.id }, _sum: { pendingAmount: true } }),
        prisma.advance.aggregate({ where: { customerId: farmer.id }, _sum: { pendingAmount: true } }),
      ]);

      const p1 = await BillingPreviewService.generateBillingPreview(admin.id, {
        farmerId: farmer.id,
        cycleType: 'TEN_DAY',
        startDate: '2025-04-11',
        endDate: '2025-04-20',
      });
      const p2 = await BillingPreviewService.generateBillingPreview(admin.id, {
        farmerId: farmer.id,
        cycleType: 'TEN_DAY',
        startDate: '2025-04-11',
        endDate: '2025-04-20',
      });

      assert.strictEqual(p1.feedSummary.deducted, '5000.00');
      assert.strictEqual(p1.advanceSummary.deducted, '2500.00');
      assert.strictEqual(p1.advanceSummary.remaining, '1500.00');
      assert.strictEqual(p1.settlementSummary.netPayable, '0.00');
      assert.strictEqual(p1.fingerprint, p2.fingerprint);
      previewId = p2.previewId;

      const after = await Promise.all([
        prisma.billSettlement.count({ where: { customerId: farmer.id } }),
        prisma.foodSale.aggregate({ where: { customerId: farmer.id }, _sum: { pendingAmount: true } }),
        prisma.advance.aggregate({ where: { customerId: farmer.id }, _sum: { pendingAmount: true } }),
      ]);
      assert.deepStrictEqual(after, before);
    });

    await test('8-11: Finalization creates allocations, updates carry-forward, matches detail API & passes ReconciliationService', async () => {
      const finalized = await SettlementService.finalizeSettlement(admin.id, admin.id, {
        previewId,
        farmerId: farmer.id,
        startDate: '2025-04-11',
        endDate: '2025-04-20',
        idempotencyKey: `p12-int-${Date.now()}`,
      });

      assert.strictEqual(finalized.feedSummary.deducted, '5000.00');
      assert.strictEqual(finalized.feedSummary.remaining, '0.00');
      assert.strictEqual(finalized.advanceSummary.deducted, '2500.00');
      assert.strictEqual(finalized.advanceSummary.remaining, '1500.00');
      assert.strictEqual(finalized.settlementSummary.netPayable, '0.00');

      const detail = await SettlementHistoryService.getSettlementDetail(
        admin.id,
        finalized.settlementId
      );
      assert.strictEqual(detail.summary.grossMilkAmount, '7500.00');
      assert.strictEqual(detail.summary.feedDeducted, '5000.00');
      assert.strictEqual(detail.summary.advanceDeducted, '2500.00');
      assert.strictEqual(detail.summary.remainingAdvance, '1500.00');
      assert.strictEqual(detail.milkCollections.length, 2);
      assert.strictEqual(detail.feedAllocations.length, 2);
      assert.strictEqual(detail.advanceAllocations.length, 1);

      // Reconcile persisted DB settlement record
      const dbSettlement = await prisma.billSettlement.findUnique({
        where: { id: finalized.settlementId },
        include: {
          milkEntries: true,
          feedAllocations: true,
          advanceAllocations: true,
          ledgerEntry: true,
        },
      });
      assert(dbSettlement);
      const report = ReconciliationService.reconcileSettlement(dbSettlement);
      assert.strictEqual(report.isReconciled, true, JSON.stringify(report.discrepancies));

      // Tenant isolation check
      if (otherAdmin) {
        await assert.rejects(
          () => SettlementHistoryService.getSettlementDetail(otherAdmin.id, finalized.settlementId),
          (err: any) => err.statusCode === 404
        );
      }
    });
  } finally {
    await cleanupTestCustomer(farmer.id);
  }

  console.log('\n================================================================================');
  console.log(`PHASE 12 INTEGRATION TESTS: TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
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

