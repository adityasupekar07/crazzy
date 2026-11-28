import assert from 'assert';
import prisma from '../db/index.js';
import { FarmerHistoryService } from '../modules/billing/services/farmer-history.service.js';
import {
  farmerHistoryParamsSchema,
  farmerHistoryQuerySchema,
} from '../modules/billing/validators/billing.schema.js';
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
  console.log('SMART DAIRY — PHASE 5: FARMER HISTORY API TEST SUITE');
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

  // Determine actual seeded date window from Ramesh's milk entries
  const latestMilk = await prisma.milkEntry.findFirst({
    where: { customerId: farmer.id, customer: { adminId: admin.id }, isReversed: false },
    orderBy: { date: 'desc' },
  });
  const earliestMilk = await prisma.milkEntry.findFirst({
    where: { customerId: farmer.id, customer: { adminId: admin.id }, isReversed: false },
    orderBy: { date: 'asc' },
  });
  assert(latestMilk && earliestMilk, 'Seeded milk entries for #101 must exist');

  const toIstYmd = (d: Date) =>
    new Date(d.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const startDate = toIstYmd(earliestMilk.date);
  const endDate = toIstYmd(latestMilk.date);

  await test('Test 1: Fetches consolidated milk, feed, and advance history with Decimal formatting', async () => {
    const res = await FarmerHistoryService.getFarmerBillingHistory(
      admin.id,
      farmer.id,
      startDate,
      endDate
    );

    assert.strictEqual(res.farmer.id, farmer.id);
    assert.strictEqual(res.farmer.code, 101);
    assert.strictEqual(res.period.startDate, startDate);
    assert.strictEqual(res.period.endDate, endDate);

    assert(res.milkCollections.length > 0, 'Should have milk collections in period');
    assert.match(res.milkSummary.totalLitres, /^\d+\.\d{2}$/);
    assert.match(res.milkSummary.totalAmount, /^\d+\.\d{2}$/);
    assert.strictEqual(
      res.milkSummary.eligibleCount + res.milkSummary.settledCount,
      res.milkCollections.length
    );

    // Check historical rate preservation
    const firstMilk = res.milkCollections[0];
    assert.match(firstMilk.rate, /^\d+\.\d{2}$/);
    assert.match(firstMilk.amount, /^\d+\.\d{2}$/);

    // Feed summary consistency
    const prevDec = new Decimal(res.feedSummary.previousOutstanding);
    const currDec = new Decimal(res.feedSummary.currentSales);
    const totalDec = new Decimal(res.feedSummary.totalOutstanding);
    assert(
      prevDec.plus(currDec).equals(totalDec),
      'Feed totalOutstanding must equal previousOutstanding + currentSales'
    );

    // Advance summary consistency against Advance.pendingAmount
    const advances = await prisma.advance.findMany({
      where: { adminId: admin.id, customerId: farmer.id },
    });
    const dbPendingAdv = advances.reduce(
      (acc, a) => acc.plus(new Decimal(a.pendingAmount.toString())),
      new Decimal(0)
    );
    assert(
      new Decimal(res.advanceSummary.remainingOutstanding).equals(dbPendingAdv),
      `Advance remainingOutstanding (${res.advanceSummary.remainingOutstanding}) must match DB pendingAmount (${dbPendingAdv.toFixed(2)})`
    );
  });

  await test('Test 2: Excludes reversed milk entries and identifies settled entries without counting them in eligible totals', async () => {
    const baseline = await FarmerHistoryService.getFarmerBillingHistory(
      admin.id,
      farmer.id,
      startDate,
      endDate
    );

    const tempReversed = await prisma.milkEntry.create({
      data: {
        customerId: farmer.id,
        date: latestMilk.date,
        shift: 'EVENING',
        milkType: 'COW',
        quantity: 99,
        fat: 4.0,
        snf: 8.5,
        rate: 40,
        totalAmount: 3960,
        isReversed: true,
      },
    });

    const tempSettled = await prisma.milkEntry.create({
      data: {
        customerId: farmer.id,
        date: latestMilk.date,
        shift: 'MORNING',
        milkType: 'COW',
        quantity: 10,
        fat: 4.0,
        snf: 8.5,
        rate: 40,
        totalAmount: 400,
        isSettled: true,
        isReversed: false,
      },
    });

    try {
      const updated = await FarmerHistoryService.getFarmerBillingHistory(
        admin.id,
        farmer.id,
        startDate,
        endDate
      );

      assert(
        !updated.milkCollections.some((m) => m.id === tempReversed.id),
        'Reversed milk entry must be excluded'
      );

      const settledRow = updated.milkCollections.find((m) => m.id === tempSettled.id);
      assert(settledRow, 'Settled milk entry should still appear in history');
      assert.strictEqual(settledRow.isSettled, true);

      assert.strictEqual(
        updated.milkSummary.eligibleCount,
        baseline.milkSummary.eligibleCount,
        'Settled entry must not be counted in eligibleCount'
      );
      assert.strictEqual(
        updated.milkSummary.totalAmount,
        baseline.milkSummary.totalAmount,
        'Settled entry must not be added to eligible totalAmount'
      );
      assert.strictEqual(
        updated.milkSummary.settledCount,
        baseline.milkSummary.settledCount + 1
      );
    } finally {
      await prisma.milkEntry.deleteMany({
        where: { id: { in: [tempReversed.id, tempSettled.id] } },
      });
    }
  });

  await test('Test 3: Feed sales separate PREVIOUS_OUTSTANDING from CURRENT_PERIOD', async () => {
    // Query only the last day so earlier pending feed sales become PREVIOUS_OUTSTANDING
    const singleDay = await FarmerHistoryService.getFarmerBillingHistory(
      admin.id,
      farmer.id,
      endDate,
      endDate
    );

    const hasPrevious = singleDay.feedSales.some(
      (f) => f.category === 'PREVIOUS_OUTSTANDING'
    );
    assert(
      hasPrevious || singleDay.feedSales.length === 0,
      'Earlier pending feed sales before startDate must be categorized as PREVIOUS_OUTSTANDING'
    );
  });

  await test('Test 4: Rejects cross-dairy farmer access', async () => {
    if (!otherAdmin) {
      console.log('    (skipped: only one admin in DB)');
      return;
    }
    await assert.rejects(
      () =>
        FarmerHistoryService.getFarmerBillingHistory(
          otherAdmin.id,
          farmer.id,
          startDate,
          endDate
        ),
      (err: any) => err.statusCode === 404
    );
  });

  await test('Test 5: Rejects invalid date range (startDate > endDate)', async () => {
    await assert.rejects(
      () =>
        FarmerHistoryService.getFarmerBillingHistory(
          admin.id,
          farmer.id,
          endDate,
          '2000-01-01'
        ),
      (err: any) => err.statusCode === 400
    );
  });

  await test('Test 6: Zod schemas validate params and query', () => {
    const p = farmerHistoryParamsSchema.parse({ farmerId: 'abc-123' });
    assert.strictEqual(p.farmerId, 'abc-123');

    const q = farmerHistoryQuerySchema.parse({
      startDate: '2026-11-01',
      endDate: '2026-11-15',
    });
    assert.strictEqual(q.startDate, '2026-11-01');
    assert.strictEqual(q.endDate, '2026-11-15');

    assert.throws(() => farmerHistoryParamsSchema.parse({ farmerId: '' }));
    assert.throws(() =>
      farmerHistoryQuerySchema.parse({ startDate: '', endDate: '2026-11-15' })
    );
  });

  console.log('\n================================================================================');
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
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

