import assert from 'assert';
import { Decimal } from 'decimal.js';
import {
  calculateBillingSettlement,
  BillingCalculationResult,
} from '../modules/billing/services/billing-calculation.service.js';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

function verifyInvariant(res: BillingCalculationResult) {
  const milk = new Decimal(res.totalMilkAmount);
  const feedOut = new Decimal(res.totalFeedOutstanding);
  const feedDed = new Decimal(res.feedDeducted);
  const remFeed = new Decimal(res.remainingFeed);
  const advOut = new Decimal(res.totalAdvanceOutstanding);
  const advDed = new Decimal(res.advanceDeducted);
  const remAdv = new Decimal(res.remainingAdvance);
  const payable = new Decimal(res.finalPayable);

  assert(milk.equals(feedDed.plus(advDed).plus(payable)), 'MilkAmount = FeedDeducted + AdvanceDeducted + NetPayable');
  assert(feedOut.equals(feedDed.plus(remFeed)), 'FeedOutstanding = FeedDeducted + RemainingFeed');
  assert(advOut.equals(advDed.plus(remAdv)), 'AdvanceOutstanding = AdvanceDeducted + RemainingAdvance');
  assert(!payable.isNegative(), 'Final payable cannot be negative');
  assert(feedDed.lessThanOrEqualTo(feedOut), 'Feed deduction cannot exceed feed outstanding');
  assert(advDed.lessThanOrEqualTo(advOut), 'Advance deduction cannot exceed advance outstanding');
}

function run() {
  console.log('================================================================================');
  console.log('SMART DAIRY — PHASE 12: CALCULATION TEST SUITE');
  console.log('================================================================================\n');

  // Feed deduction scenarios
  test('Feed 1: Feed amount greater than milk amount', () => {
    const res = calculateBillingSettlement({
      totalMilkAmount: '5000.00',
      totalFeedOutstanding: '7000.00',
      totalAdvanceOutstanding: '2000.00',
    });
    assert.strictEqual(res.feedDeducted, '5000.00');
    assert.strictEqual(res.remainingFeed, '2000.00');
    assert.strictEqual(res.advanceDeducted, '0.00');
    assert.strictEqual(res.finalPayable, '0.00');
    verifyInvariant(res);
  });

  test('Feed 2: Feed amount equal to milk amount', () => {
    const res = calculateBillingSettlement({
      totalMilkAmount: '6000.00',
      totalFeedOutstanding: '6000.00',
      totalAdvanceOutstanding: '1000.00',
    });
    assert.strictEqual(res.feedDeducted, '6000.00');
    assert.strictEqual(res.remainingFeed, '0.00');
    assert.strictEqual(res.advanceDeducted, '0.00');
    assert.strictEqual(res.finalPayable, '0.00');
    verifyInvariant(res);
  });

  test('Feed 3: Feed amount less than milk amount', () => {
    const res = calculateBillingSettlement({
      totalMilkAmount: '10000.00',
      totalFeedOutstanding: '3000.00',
      totalAdvanceOutstanding: '0.00',
    });
    assert.strictEqual(res.feedDeducted, '3000.00');
    assert.strictEqual(res.remainingFeed, '0.00');
    assert.strictEqual(res.finalPayable, '7000.00');
    verifyInvariant(res);
  });

  test('Feed 4: Partial feed settlement leaves carry-forward', () => {
    const res = calculateBillingSettlement({
      totalMilkAmount: '2500.50',
      totalFeedOutstanding: '4000.75',
      totalAdvanceOutstanding: '500.00',
    });
    assert.strictEqual(res.feedDeducted, '2500.50');
    assert.strictEqual(res.remainingFeed, '1500.25');
    assert.strictEqual(res.advanceDeducted, '0.00');
    verifyInvariant(res);
  });

  test('Feed 5: Zero feed purchases', () => {
    const res = calculateBillingSettlement({
      totalMilkAmount: '8000.00',
      totalFeedOutstanding: '0.00',
      totalAdvanceOutstanding: '1500.00',
    });
    assert.strictEqual(res.feedDeducted, '0.00');
    assert.strictEqual(res.advanceDeducted, '1500.00');
    assert.strictEqual(res.finalPayable, '6500.00');
    verifyInvariant(res);
  });

  test('Feed 6: Previous feed outstanding combined with current feed sales (2000 + 1500 = 3500)', () => {
    const combinedFeed = new Decimal('2000.00').plus('1500.00').toFixed(2);
    const res = calculateBillingSettlement({
      totalMilkAmount: '6500.00',
      totalFeedOutstanding: combinedFeed,
      totalAdvanceOutstanding: '1000.00',
    });
    assert.strictEqual(res.feedDeducted, '3500.00');
    assert.strictEqual(res.remainingFeed, '0.00');
    assert.strictEqual(res.advanceDeducted, '1000.00');
    assert.strictEqual(res.finalPayable, '2000.00');
    verifyInvariant(res);
  });

  // Advance deduction scenarios
  test('Advance 1: Advance greater than remaining milk amount', () => {
    const res = calculateBillingSettlement({
      totalMilkAmount: '10000.00',
      totalFeedOutstanding: '2000.00',
      totalAdvanceOutstanding: '12000.00',
    });
    assert.strictEqual(res.feedDeducted, '2000.00');
    assert.strictEqual(res.advanceDeducted, '8000.00');
    assert.strictEqual(res.remainingAdvance, '4000.00');
    assert.strictEqual(res.finalPayable, '0.00');
    verifyInvariant(res);
  });

  test('Advance 2: Advance equal to remaining milk amount', () => {
    const res = calculateBillingSettlement({
      totalMilkAmount: '10000.00',
      totalFeedOutstanding: '3500.00',
      totalAdvanceOutstanding: '6500.00',
    });
    assert.strictEqual(res.advanceDeducted, '6500.00');
    assert.strictEqual(res.remainingAdvance, '0.00');
    assert.strictEqual(res.finalPayable, '0.00');
    verifyInvariant(res);
  });

  test('Advance 3: Advance less than remaining milk amount', () => {
    const res = calculateBillingSettlement({
      totalMilkAmount: '10000.00',
      totalFeedOutstanding: '3000.00',
      totalAdvanceOutstanding: '2000.00',
    });
    assert.strictEqual(res.advanceDeducted, '2000.00');
    assert.strictEqual(res.remainingAdvance, '0.00');
    assert.strictEqual(res.finalPayable, '5000.00');
    verifyInvariant(res);
  });

  test('Advance 4: Partial advance settlement leaves carry-forward', () => {
    const res = calculateBillingSettlement({
      totalMilkAmount: '6500.00',
      totalFeedOutstanding: '3500.00',
      totalAdvanceOutstanding: '6000.00',
    });
    assert.strictEqual(res.feedDeducted, '3500.00');
    assert.strictEqual(res.advanceDeducted, '3000.00');
    assert.strictEqual(res.remainingAdvance, '3000.00');
    assert.strictEqual(res.finalPayable, '0.00');
    verifyInvariant(res);
  });

  test('Advance 5: No outstanding advance', () => {
    const res = calculateBillingSettlement({
      totalMilkAmount: '5000.00',
      totalFeedOutstanding: '1200.00',
      totalAdvanceOutstanding: '0.00',
    });
    assert.strictEqual(res.advanceDeducted, '0.00');
    assert.strictEqual(res.finalPayable, '3800.00');
    verifyInvariant(res);
  });

  // Additional scenarios
  test('Additional 1: Zero milk collection', () => {
    const res = calculateBillingSettlement({
      totalMilkAmount: '0.00',
      totalFeedOutstanding: '3000.00',
      totalAdvanceOutstanding: '2000.00',
    });
    assert.strictEqual(res.feedDeducted, '0.00');
    assert.strictEqual(res.advanceDeducted, '0.00');
    assert.strictEqual(res.remainingFeed, '3000.00');
    assert.strictEqual(res.remainingAdvance, '2000.00');
    assert.strictEqual(res.finalPayable, '0.00');
    verifyInvariant(res);
  });

  test('Additional 2: No feed and no advance', () => {
    const res = calculateBillingSettlement({
      totalMilkAmount: '9543.25',
      totalFeedOutstanding: '0.00',
      totalAdvanceOutstanding: '0.00',
    });
    assert.strictEqual(res.finalPayable, '9543.25');
    verifyInvariant(res);
  });

  test('Additional 3 & 5: Feed consumes part of milk and advance consumes remainder', () => {
    const res = calculateBillingSettlement({
      totalMilkAmount: '7500.00',
      totalFeedOutstanding: '2500.00',
      totalAdvanceOutstanding: '5000.00',
    });
    assert.strictEqual(res.feedDeducted, '2500.00');
    assert.strictEqual(res.advanceDeducted, '5000.00');
    assert.strictEqual(res.finalPayable, '0.00');
    verifyInvariant(res);
  });

  test('Additional 6: Decimal precision and rounding edge cases (0.10 + 0.20 = 0.30)', () => {
    const res = calculateBillingSettlement({
      totalMilkAmount: '100.30',
      totalFeedOutstanding: '0.10',
      totalAdvanceOutstanding: '0.20',
    });
    assert.strictEqual(res.feedDeducted, '0.10');
    assert.strictEqual(res.advanceDeducted, '0.20');
    assert.strictEqual(res.finalPayable, '100.00');
    verifyInvariant(res);
  });

  console.log('\n================================================================================');
  console.log(`PHASE 12 CALCULATION TESTS: TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================================');
  if (failed > 0) process.exit(1);
}

run();

