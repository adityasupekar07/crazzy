import assert from 'assert';
import prisma from '../db/index.js';
import { BillingPreviewService } from '../modules/billing/services/billing-preview.service.js';
import { SettlementService } from '../modules/billing/services/settlement.service.js';
import { FarmerHistoryService } from '../modules/billing/services/farmer-history.service.js';
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
  console.log('SMART DAIRY — PHASE 10: OUTSTANDING BALANCE & CARRY-FORWARD TEST SUITE');
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

  // ── 1. ReconciliationService unit tests (all inconsistency detections) ─────
  await test('Reconciliation: Detects negative feed and advance balances', () => {
    assert.throws(
      () =>
        ReconciliationService.reconcileFeedSale({
          id: 'fs-neg',
          totalAmount: 1000,
          amountPaid: 1100,
          pendingAmount: -100,
          settlementAllocations: [],
        }),
      (err: any) => err.code === 'FEED_NEGATIVE_BALANCE'
    );
    assert.throws(
      () =>
        ReconciliationService.reconcileAdvance({
          id: 'adv-neg',
          originalAmount: 1000,
          recoveredAmount: 1100,
          pendingAmount: -100,
          transactions: [],
          settlementAllocations: [],
        }),
      (err: any) => err.code === 'ADVANCE_NEGATIVE_BALANCE'
    );
  });

  await test('Reconciliation: Detects duplicate feed/advance allocations and double BILL_SETTLEMENT_RECOVERY', () => {
    assert.throws(
      () =>
        ReconciliationService.reconcileFeedSale({
          id: 'fs-dup',
          totalAmount: 2000,
          amountPaid: 1000,
          pendingAmount: 1000,
          settlementAllocations: [
            { settlementId: 's1', allocatedAmount: 500, settlement: { status: 'FINALIZED' } },
            { settlementId: 's1', allocatedAmount: 500, settlement: { status: 'FINALIZED' } },
          ],
        }),
      (err: any) => err.code === 'FEED_DUPLICATE_ALLOCATION'
    );

    assert.throws(
      () =>
        ReconciliationService.reconcileAdvance({
          id: 'adv-dup-tx',
          originalAmount: 2000,
          recoveredAmount: 1000,
          pendingAmount: 1000,
          transactions: [
            { id: 't1', type: 'BILL_SETTLEMENT_RECOVERY', amount: 500, settlementId: 's1', settlement: { status: 'FINALIZED' } },
            { id: 't2', type: 'BILL_SETTLEMENT_RECOVERY', amount: 500, settlementId: 's1', settlement: { status: 'FINALIZED' } },
          ],
          settlementAllocations: [
            { settlementId: 's1', allocatedAmount: 500, settlement: { status: 'FINALIZED' } },
          ],
        }),
      (err: any) => err.code === 'ADVANCE_DUPLICATE_RECOVERY'
    );
  });

  await test('Reconciliation: Detects allocation exceeding original amount and pending mismatch', () => {
    assert.throws(
      () =>
        ReconciliationService.reconcileFeedSale({
          id: 'fs-over',
          totalAmount: 1000,
          amountPaid: 1200,
          pendingAmount: 0,
          settlementAllocations: [
            { settlementId: 's1', allocatedAmount: 1200, settlement: { status: 'FINALIZED' } },
          ],
        }),
      (err: any) => err.code === 'FEED_ALLOCATION_EXCEEDS_ORIGINAL'
    );

    assert.throws(
      () =>
        ReconciliationService.reconcileFeedSale({
          id: 'fs-mismatch',
          totalAmount: 1000,
          amountPaid: 200,
          pendingAmount: 900,
          settlementAllocations: [],
        }),
      (err: any) => err.code === 'FEED_RECONCILIATION_MISMATCH'
    );

    assert.throws(
      () =>
        ReconciliationService.reconcileAdvance({
          id: 'adv-missing-ref',
          originalAmount: 1000,
          recoveredAmount: 500,
          pendingAmount: 500,
          transactions: [
            { id: 't1', type: 'BILL_SETTLEMENT_RECOVERY', amount: 500, settlementId: null },
          ],
          settlementAllocations: [],
        }),
      (err: any) => err.code === 'ADVANCE_MISSING_SETTLEMENT_REF'
    );
  });

  // ── 2. Multi-Cycle Integration Tests (₹7,000 Feed + ₹4,000/₹2,000 Advance) ─
  await prisma.customer.deleteMany({ where: { adminId: admin.id, code: 99910 } });
  const farmer = await prisma.customer.create({
    data: {
      adminId: admin.id,
      code: 99910,
      name: 'Phase10 CarryForward Farmer',
      mobile: '9999999910',
      milkType: 'COW',
      isActive: true,
    },
  });

  try {
    // Cycle 1: 2025-02-01 to 2025-02-10
    // Feed dues = ₹7,000, Milk = ₹5,000 -> Feed Deducted ₹5,000, Feed Remaining = ₹2,000
    const c1Date = new Date('2025-02-05T06:00:00.000Z');
    await prisma.milkEntry.create({
      data: {
        customerId: farmer.id,
        date: c1Date,
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
    const feed1 = await prisma.foodSale.create({
      data: {
        adminId: admin.id,
        customerId: farmer.id,
        foodPurchaseId: foodPurchase.id,
        foodName: foodPurchase.foodName,
        quantity: 7,
        sellRate: 1000,
        totalAmount: 7000,
        amountPaid: 0,
        pendingAmount: 7000,
        isCashPayment: false,
        saleDate: c1Date,
        isActive: true,
      },
    });

    // Also create an inactive/reversed feed sale (must be excluded)
    await prisma.foodSale.create({
      data: {
        adminId: admin.id,
        customerId: farmer.id,
        foodPurchaseId: foodPurchase.id,
        foodName: 'Cancelled Feed',
        quantity: 1,
        sellRate: 999,
        totalAmount: 999,
        amountPaid: 0,
        pendingAmount: 999,
        isCashPayment: false,
        saleDate: c1Date,
        isActive: false,
      },
    });

    await test('Cycle 1: ₹7,000 feed with ₹5,000 milk deducts ₹5,000 and leaves ₹2,000 carry-forward', async () => {
      const p1 = await BillingPreviewService.generateBillingPreview(admin.id, {
        farmerId: farmer.id,
        cycleType: 'TEN_DAY',
        startDate: '2025-02-01',
        endDate: '2025-02-10',
      });
      assert.strictEqual(p1.feedSummary.totalOutstanding, '7000.00');
      assert.strictEqual(p1.feedSummary.deducted, '5000.00');
      assert.strictEqual(p1.feedSummary.remaining, '2000.00');

      const s1 = await SettlementService.finalizeSettlement(admin.id, admin.id, {
        previewId: p1.previewId,
        farmerId: farmer.id,
        startDate: '2025-02-01',
        endDate: '2025-02-10',
        idempotencyKey: `p10-c1-${Date.now()}`,
      });
      assert.strictEqual(s1.feedSummary.deducted, '5000.00');
      assert.strictEqual(s1.feedSummary.remaining, '2000.00');
      assert.strictEqual(s1.settlementSummary.netPayable, '0.00');
    });

    // Cycle 2: 2025-02-11 to 2025-02-20
    // Previous feed = ₹2,000 + New feed = ₹1,500 => Total feed = ₹3,500
    // Advance opening ₹4,000 + New advance ₹2,000 = ₹6,000
    // Milk = ₹6,500 -> Feed deducted ₹3,500 (remaining ₹0), remaining milk = ₹3,000
    // Advance deducted = ₹3,000 -> Advance remaining = ₹3,000, Final payable = ₹0
    const c2Date = new Date('2025-02-15T06:00:00.000Z');
    await prisma.milkEntry.create({
      data: {
        customerId: farmer.id,
        date: c2Date,
        shift: 'MORNING',
        milkType: 'COW',
        quantity: 130,
        fat: 4.0,
        snf: 8.5,
        rate: 50,
        totalAmount: 6500,
        isReversed: false,
        isSettled: false,
      },
    });
    const feed2 = await prisma.foodSale.create({
      data: {
        adminId: admin.id,
        customerId: farmer.id,
        foodPurchaseId: foodPurchase.id,
        foodName: foodPurchase.foodName,
        quantity: 1.5,
        sellRate: 1000,
        totalAmount: 1500,
        amountPaid: 0,
        pendingAmount: 1500,
        isCashPayment: false,
        saleDate: c2Date,
        isActive: true,
      },
    });
    const advOpen = await prisma.advance.create({
      data: {
        adminId: admin.id,
        customerId: farmer.id,
        advanceNumber: `ADV-P10-OPEN-${Date.now()}`,
        originalAmount: 4000,
        recoveredAmount: 0,
        pendingAmount: 4000,
        status: 'ACTIVE',
        givenDate: c1Date,
      },
    });
    await prisma.advanceTransaction.create({
      data: { advanceId: advOpen.id, type: 'ISSUED', amount: 4000, createdBy: admin.id },
    });
    const advNew = await prisma.advance.create({
      data: {
        adminId: admin.id,
        customerId: farmer.id,
        advanceNumber: `ADV-P10-NEW-${Date.now()}`,
        originalAmount: 2000,
        recoveredAmount: 0,
        pendingAmount: 2000,
        status: 'ACTIVE',
        givenDate: c2Date,
      },
    });
    await prisma.advanceTransaction.create({
      data: { advanceId: advNew.id, type: 'ISSUED', amount: 2000, createdBy: admin.id },
    });

    await test('Cycle 2: Preview & Settlement reflect ₹2,000 prev + ₹1,500 new feed = ₹3,500, and ₹4,000 + ₹2,000 advance -> ₹3,000 deducted, ₹3,000 remaining', async () => {
      const p2 = await BillingPreviewService.generateBillingPreview(admin.id, {
        farmerId: farmer.id,
        cycleType: 'TEN_DAY',
        startDate: '2025-02-11',
        endDate: '2025-02-20',
      });

      assert.strictEqual(p2.feedSummary.previousOutstanding, '2000.00');
      assert.strictEqual(p2.feedSummary.currentSales, '1500.00');
      assert.strictEqual(p2.feedSummary.totalOutstanding, '3500.00');
      assert.strictEqual(p2.feedSummary.deducted, '3500.00');
      assert.strictEqual(p2.feedSummary.remaining, '0.00');

      assert.strictEqual(p2.advanceSummary.totalOutstanding, '6000.00');
      assert.strictEqual(p2.advanceSummary.deducted, '3000.00');
      assert.strictEqual(p2.advanceSummary.remaining, '3000.00');
      assert.strictEqual(p2.settlementSummary.netPayable, '0.00');

      // Repeated preview does not mutate balances
      const p2Again = await BillingPreviewService.generateBillingPreview(admin.id, {
        farmerId: farmer.id,
        cycleType: 'TEN_DAY',
        startDate: '2025-02-11',
        endDate: '2025-02-20',
      });
      assert.strictEqual(p2Again.feedSummary.totalOutstanding, '3500.00');
      assert.strictEqual(p2Again.advanceSummary.totalOutstanding, '6000.00');

      const s2 = await SettlementService.finalizeSettlement(admin.id, admin.id, {
        previewId: p2.previewId,
        farmerId: farmer.id,
        startDate: '2025-02-11',
        endDate: '2025-02-20',
        idempotencyKey: `p10-c2-${Date.now()}`,
      });
      assert.strictEqual(s2.feedSummary.remaining, '0.00');
      assert.strictEqual(s2.advanceSummary.deducted, '3000.00');
      assert.strictEqual(s2.advanceSummary.remaining, '3000.00');

      const dbFeed1 = await prisma.foodSale.findUnique({ where: { id: feed1.id } });
      const dbFeed2 = await prisma.foodSale.findUnique({ where: { id: feed2.id } });
      assert.strictEqual(Number(dbFeed1?.pendingAmount), 0);
      assert.strictEqual(Number(dbFeed2?.pendingAmount), 0);
    });

    // Cycle 3: 2025-02-21 to 2025-02-28
    // External repayment of ₹1,000 on remaining ₹3,000 advance -> advance outstanding = ₹2,000
    // New milk = ₹5,000 -> Feed = ₹0, Advance deducted = ₹2,000, Net Payable = ₹3,000
    const c3Date = new Date('2025-02-24T06:00:00.000Z');
    await prisma.milkEntry.create({
      data: {
        customerId: farmer.id,
        date: c3Date,
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

    // External repayment of ₹1,000 on advOpen (which had ₹1,000 left)
    await prisma.$transaction(async (tx) => {
      await tx.advanceTransaction.create({
        data: {
          advanceId: advOpen.id,
          type: 'MANUAL_REPAYMENT',
          amount: 1000,
          notes: 'External cash repayment',
          createdBy: admin.id,
        },
      });
      await tx.advance.update({
        where: { id: advOpen.id },
        data: {
          recoveredAmount: 4000,
          pendingAmount: 0,
          status: 'CLOSED',
        },
      });
    });

    await test('Cycle 3: Fully settled feed contributes 0.00, external advance repayment reduces advance to ₹2,000, and final settlement closes remaining advance', async () => {
      const history = await FarmerHistoryService.getFarmerBillingHistory(
        admin.id,
        farmer.id,
        '2025-02-21',
        '2025-02-28'
      );
      assert.strictEqual(history.feedSummary.totalOutstanding, '0.00');
      assert.strictEqual(history.advanceSummary.totalGiven, '6000.00');
      assert.strictEqual(history.advanceSummary.totalRepaid, '4000.00');
      assert.strictEqual(history.advanceSummary.remainingOutstanding, '2000.00');

      const p3 = await BillingPreviewService.generateBillingPreview(admin.id, {
        farmerId: farmer.id,
        cycleType: 'TEN_DAY',
        startDate: '2025-02-21',
        endDate: '2025-02-28',
      });
      assert.strictEqual(p3.feedSummary.totalOutstanding, '0.00');
      assert.strictEqual(p3.advanceSummary.totalOutstanding, '2000.00');
      assert.strictEqual(p3.advanceSummary.deducted, '2000.00');
      assert.strictEqual(p3.advanceSummary.remaining, '0.00');
      assert.strictEqual(p3.settlementSummary.netPayable, '3000.00');

      const s3 = await SettlementService.finalizeSettlement(admin.id, admin.id, {
        previewId: p3.previewId,
        farmerId: farmer.id,
        startDate: '2025-02-21',
        endDate: '2025-02-28',
        idempotencyKey: `p10-c3-${Date.now()}`,
      });
      assert.strictEqual(s3.advanceSummary.remaining, '0.00');
      assert.strictEqual(s3.settlementSummary.netPayable, '3000.00');

      // Cross-dairy isolation check
      if (otherAdmin) {
        await assert.rejects(
          () =>
            BillingPreviewService.generateBillingPreview(otherAdmin.id, {
              farmerId: farmer.id,
              cycleType: 'TEN_DAY',
              startDate: '2025-02-21',
              endDate: '2025-02-28',
            }),
          (err: any) => err.statusCode === 404
        );
      }
    });
  } finally {
    await cleanupTestCustomer(farmer.id);
  }

  console.log('\n================================================================================');
  console.log(`PHASE 10 TEST RESULTS: TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
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

