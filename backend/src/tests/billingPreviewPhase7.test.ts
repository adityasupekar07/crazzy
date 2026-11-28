import assert from 'assert';
import prisma from '../db/index.js';
import { BillingPreviewService } from '../modules/billing/services/billing-preview.service.js';
import { calculateBillingSettlement } from '../modules/billing/services/billing-calculation.service.js';
import { billingPreviewRequestSchema } from '../modules/billing/validators/billing.schema.js';
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

async function run() {
  console.log('================================================================================');
  console.log('SMART DAIRY — PHASE 7: BILL PREVIEW API TEST SUITE');
  console.log('================================================================================\n');

  const admin = await prisma.admin.findFirst({
    where: { OR: [{ mobile: '8767537562' }, { mobile: '+918767537562' }] },
  });
  assert(admin, 'Target test dairy admin 8767537562 must exist');

  const otherAdmin = await prisma.admin.findFirst({
    where: { id: { not: admin.id } },
  });

  const farmer = await prisma.customer.findFirst({
    where: { adminId: admin.id, code: 101 },
  });
  assert(farmer, 'Seeded farmer #101 (Ramesh Patil) must exist');

  const earliestMilk = await prisma.milkEntry.findFirst({
    where: { customerId: farmer.id, customer: { adminId: admin.id }, isReversed: false },
    orderBy: { date: 'asc' },
  });
  const latestMilk = await prisma.milkEntry.findFirst({
    where: { customerId: farmer.id, customer: { adminId: admin.id }, isReversed: false },
    orderBy: { date: 'desc' },
  });
  assert(earliestMilk && latestMilk, 'Seeded milk entries for #101 must exist');

  const toIstYmd = (d: Date) =>
    new Date(d.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const startDate = toIstYmd(earliestMilk.date);
  const endDate = toIstYmd(latestMilk.date);

  await test('1 & 12 & 13: Valid preview request matches Phase 6 calculation and returns item-level records & summaries', async () => {
    const res = await BillingPreviewService.generateBillingPreview(admin.id, {
      farmerId: farmer.id,
      cycleType: 'CUSTOM',
      startDate,
      endDate,
    });

    assert(res.previewId && res.previewId.length > 10, 'previewId must be generated');
    assert(res.fingerprint && res.fingerprint.length === 64, 'SHA-256 fingerprint must be generated');
    assert.strictEqual(res.farmer.id, farmer.id);
    assert.strictEqual(res.farmer.name, farmer.name);
    assert.strictEqual(res.billingPeriod.cycleType, 'CUSTOM');
    assert.strictEqual(res.billingPeriod.startDate, startDate);
    assert.strictEqual(res.billingPeriod.endDate, endDate);

    assert(res.milkCollections.length > 0, 'Should return eligible milkCollections');
    assert(res.feedSales.length > 0, 'Should return unsettled feedSales');
    assert(res.advanceHistory.length > 0, 'Should return advanceHistory');

    // Verify Phase 6 calculation parity (feed-first, advance-second)
    const phase6 = calculateBillingSettlement({
      totalMilkAmount: res.milkSummary.totalAmount,
      totalFeedOutstanding: res.feedSummary.totalOutstanding,
      totalAdvanceOutstanding: res.advanceSummary.totalOutstanding,
    });

    assert.strictEqual(res.feedSummary.deducted, phase6.feedDeducted);
    assert.strictEqual(res.feedSummary.remaining, phase6.remainingFeed);
    assert.strictEqual(res.advanceSummary.deducted, phase6.advanceDeducted);
    assert.strictEqual(res.advanceSummary.remaining, phase6.remainingAdvance);
    assert.strictEqual(res.settlementSummary.grossAmount, phase6.totalMilkAmount);
    assert.strictEqual(res.settlementSummary.netPayable, phase6.finalPayable);

    const expectedTotalDeductions = new Decimal(phase6.feedDeducted)
      .plus(new Decimal(phase6.advanceDeducted))
      .toFixed(2);
    assert.strictEqual(res.settlementSummary.totalDeductions, expectedTotalDeductions);

    // Snapshot verification
    assert.strictEqual(res.calculationSnapshot.totalMilkAmount, res.milkSummary.totalAmount);
    assert.strictEqual(res.calculationSnapshot.totalFeedOutstanding, res.feedSummary.totalOutstanding);
    assert.strictEqual(res.calculationSnapshot.totalAdvanceOutstanding, res.advanceSummary.totalOutstanding);
  });

  await test('2: Rejects invalid / non-existent farmer ID', async () => {
    await assert.rejects(
      () =>
        BillingPreviewService.generateBillingPreview(admin.id, {
          farmerId: 'non-existent-farmer-id',
          cycleType: 'CUSTOM',
          startDate,
          endDate,
        }),
      (err: any) => err.statusCode === 404
    );
  });

  await test('3: Rejects cross-dairy farmer access', async () => {
    if (!otherAdmin) {
      console.log('    (skipped: only one admin in DB)');
      return;
    }
    await assert.rejects(
      () =>
        BillingPreviewService.generateBillingPreview(otherAdmin.id, {
          farmerId: farmer.id,
          cycleType: 'CUSTOM',
          startDate,
          endDate,
        }),
      (err: any) => err.statusCode === 404
    );
  });

  await test('4: Rejects invalid cycle boundaries, startDate > endDate, and future periods', async () => {
    // Mismatched FIFTEEN_DAY boundary
    await assert.rejects(
      () =>
        BillingPreviewService.generateBillingPreview(admin.id, {
          farmerId: farmer.id,
          cycleType: 'FIFTEEN_DAY',
          startDate: '2026-11-01',
          endDate: '2026-11-10',
        }),
      (err: any) => err.statusCode === 400
    );

    // startDate > endDate
    await assert.rejects(
      () =>
        BillingPreviewService.generateBillingPreview(admin.id, {
          farmerId: farmer.id,
          cycleType: 'CUSTOM',
          startDate: endDate,
          endDate: '2020-01-01',
        }),
      (err: any) => err.statusCode === 400
    );

    // Future period
    await assert.rejects(
      () =>
        BillingPreviewService.generateBillingPreview(admin.id, {
          farmerId: farmer.id,
          cycleType: 'CUSTOM',
          startDate: '2099-01-01',
          endDate: '2099-01-10',
        }),
      (err: any) => err.statusCode === 400
    );

    // Schema rejects unsupported cycleType
    assert.throws(() =>
      billingPreviewRequestSchema.parse({
        farmerId: farmer.id,
        cycleType: 'WEEKLY',
        startDate,
        endDate,
      })
    );
  });

  await test('5 & 6 & 7: Filters milk by period, preserves historical rate/amount, excludes reversed & settled', async () => {
    const baseline = await BillingPreviewService.generateBillingPreview(admin.id, {
      farmerId: farmer.id,
      cycleType: 'CUSTOM',
      startDate,
      endDate,
    });

    // Create 1 eligible entry with custom historical rate/amount, 1 reversed, 1 settled
    const customEligible = await prisma.milkEntry.create({
      data: {
        customerId: farmer.id,
        date: latestMilk.date,
        shift: 'MORNING',
        milkType: 'COW',
        quantity: 5,
        fat: 3.5,
        snf: 8.2,
        rate: 77.77,
        totalAmount: 388.85,
        isReversed: false,
        isSettled: false,
      },
    });
    const reversedEntry = await prisma.milkEntry.create({
      data: {
        customerId: farmer.id,
        date: latestMilk.date,
        shift: 'EVENING',
        milkType: 'COW',
        quantity: 20,
        fat: 4.0,
        snf: 8.5,
        rate: 50,
        totalAmount: 1000,
        isReversed: true,
      },
    });
    const settledEntry = await prisma.milkEntry.create({
      data: {
        customerId: farmer.id,
        date: latestMilk.date,
        shift: 'EVENING',
        milkType: 'COW',
        quantity: 15,
        fat: 4.0,
        snf: 8.5,
        rate: 50,
        totalAmount: 750,
        isReversed: false,
        isSettled: true,
      },
    });

    try {
      const updated = await BillingPreviewService.generateBillingPreview(admin.id, {
        farmerId: farmer.id,
        cycleType: 'CUSTOM',
        startDate,
        endDate,
      });

      const foundCustom = updated.milkCollections.find((m) => m.id === customEligible.id);
      assert(foundCustom, 'Eligible entry must be included');
      assert.strictEqual(foundCustom.rate, '77.77', 'Historical rate must be preserved');
      assert.strictEqual(foundCustom.amount, '388.85', 'Historical amount must be preserved');

      assert(!updated.milkCollections.some((m) => m.id === reversedEntry.id), 'Reversed entry excluded');
      assert(!updated.milkCollections.some((m) => m.id === settledEntry.id), 'Settled entry excluded');

      const expectedMilk = new Decimal(baseline.milkSummary.totalAmount).plus('388.85').toFixed(2);
      assert.strictEqual(updated.milkSummary.totalAmount, expectedMilk);
    } finally {
      await prisma.milkEntry.deleteMany({
        where: { id: { in: [customEligible.id, reversedEntry.id, settledEntry.id] } },
      });
    }
  });

  await test('8 & 9 & 10: Feed separates previous vs current, handles partial balances without double counting', async () => {
    const res = await BillingPreviewService.generateBillingPreview(admin.id, {
      farmerId: farmer.id,
      cycleType: 'CUSTOM',
      startDate: endDate,
      endDate,
    });

    const prevSum = res.feedSales
      .filter((f) => f.category === 'PREVIOUS_OUTSTANDING')
      .reduce((acc, f) => acc.plus(new Decimal(f.remainingOutstanding)), new Decimal(0));
    const currSum = res.feedSales
      .filter((f) => f.category === 'CURRENT_PERIOD')
      .reduce((acc, f) => acc.plus(new Decimal(f.remainingOutstanding)), new Decimal(0));

    assert.strictEqual(res.feedSummary.previousOutstanding, prevSum.toFixed(2));
    assert.strictEqual(res.feedSummary.currentSales, currSum.toFixed(2));
    assert.strictEqual(res.feedSummary.totalOutstanding, prevSum.plus(currSum).toFixed(2));
  });

  await test('11: Outstanding advances match Advance.pendingAmount and include repayments exactly once', async () => {
    const res = await BillingPreviewService.generateBillingPreview(admin.id, {
      farmerId: farmer.id,
      cycleType: 'CUSTOM',
      startDate,
      endDate,
    });

    const dbAdvances = await prisma.advance.findMany({
      where: { adminId: admin.id, customerId: farmer.id },
    });
    const dbPending = dbAdvances
      .reduce((acc, a) => acc.plus(new Decimal(a.pendingAmount.toString())), new Decimal(0))
      .toFixed(2);

    assert.strictEqual(res.advanceSummary.totalOutstanding, dbPending);
  });

  await test('14: Preview is strictly read-only (no DB records or balances modified)', async () => {
    const beforeCounts = await Promise.all([
      prisma.billSettlement.count(),
      prisma.settlementFeedAllocation.count(),
      prisma.settlementAdvanceAllocation.count(),
      prisma.advanceTransaction.count(),
      prisma.milkEntry.count({ where: { customerId: farmer.id, isSettled: true } }),
      prisma.foodSale.aggregate({ where: { customerId: farmer.id }, _sum: { pendingAmount: true, amountPaid: true } }),
      prisma.advance.aggregate({ where: { customerId: farmer.id }, _sum: { pendingAmount: true, recoveredAmount: true } }),
    ]);

    await BillingPreviewService.generateBillingPreview(admin.id, {
      farmerId: farmer.id,
      cycleType: 'CUSTOM',
      startDate,
      endDate,
    });

    const afterCounts = await Promise.all([
      prisma.billSettlement.count(),
      prisma.settlementFeedAllocation.count(),
      prisma.settlementAdvanceAllocation.count(),
      prisma.advanceTransaction.count(),
      prisma.milkEntry.count({ where: { customerId: farmer.id, isSettled: true } }),
      prisma.foodSale.aggregate({ where: { customerId: farmer.id }, _sum: { pendingAmount: true, amountPaid: true } }),
      prisma.advance.aggregate({ where: { customerId: farmer.id }, _sum: { pendingAmount: true, recoveredAmount: true } }),
    ]);

    assert.deepStrictEqual(afterCounts, beforeCounts, 'Preview must not mutate any database state');
  });

  await test('15: Preview fingerprint changes when relevant financial inputs change', async () => {
    const p1 = await BillingPreviewService.generateBillingPreview(admin.id, {
      farmerId: farmer.id,
      cycleType: 'CUSTOM',
      startDate,
      endDate,
    });

    const p2Same = await BillingPreviewService.generateBillingPreview(admin.id, {
      farmerId: farmer.id,
      cycleType: 'CUSTOM',
      startDate,
      endDate,
    });
    assert.strictEqual(p1.fingerprint, p2Same.fingerprint, 'Identical state yields identical fingerprint');
    assert.notStrictEqual(p1.previewId, p2Same.previewId, 'Each preview gets a unique previewId');

    const extraMilk = await prisma.milkEntry.create({
      data: {
        customerId: farmer.id,
        date: latestMilk.date,
        shift: 'MORNING',
        milkType: 'COW',
        quantity: 2,
        fat: 4.0,
        snf: 8.5,
        rate: 45,
        totalAmount: 90,
        isReversed: false,
        isSettled: false,
      },
    });

    try {
      const p3Changed = await BillingPreviewService.generateBillingPreview(admin.id, {
        farmerId: farmer.id,
        cycleType: 'CUSTOM',
        startDate,
        endDate,
      });
      assert.notStrictEqual(p3Changed.fingerprint, p1.fingerprint, 'Fingerprint must change when financial inputs change');
    } finally {
      await prisma.milkEntry.delete({ where: { id: extraMilk.id } });
    }
  });

  console.log('\n================================================================================');
  console.log(`PHASE 7 TEST RESULTS: TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
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

