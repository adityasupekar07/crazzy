import assert from 'assert';
import { Decimal } from 'decimal.js';
import {
  BillingCalculationService,
  calculateBillingSettlement,
  BillingCalculationResult,
} from '../modules/billing/services/billing-calculation.service.js';

let unitPassed = 0;
let unitFailed = 0;

function unitTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    unitPassed++;
  } catch (err: any) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    unitFailed++;
  }
}

function assertInvariants(res: BillingCalculationResult) {
  const milk = new Decimal(res.totalMilkAmount);
  const feed = new Decimal(res.totalFeedOutstanding);
  const feedDed = new Decimal(res.feedDeducted);
  const remFeed = new Decimal(res.remainingFeed);
  const adv = new Decimal(res.totalAdvanceOutstanding);
  const advDed = new Decimal(res.advanceDeducted);
  const remAdv = new Decimal(res.remainingAdvance);
  const payable = new Decimal(res.finalPayable);

  const remMilk = milk.minus(feedDed);

  assert(!milk.isNegative());
  assert(!feed.isNegative());
  assert(!feedDed.isNegative());
  assert(!remFeed.isNegative());
  assert(!adv.isNegative());
  assert(!advDed.isNegative());
  assert(!remAdv.isNegative());
  assert(!payable.isNegative());

  assert(feedDed.lessThanOrEqualTo(milk));
  assert(feedDed.lessThanOrEqualTo(feed));
  assert(advDed.lessThanOrEqualTo(remMilk));
  assert(advDed.lessThanOrEqualTo(adv));

  assert(feedDed.plus(advDed).plus(payable).equals(milk));
  assert(feedDed.plus(remFeed).equals(feed));
  assert(advDed.plus(remAdv).equals(adv));
}

/**
 * Deterministic PRNG (Mulberry32) for reproducible property-based testing.
 */
function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomMonetaryString(rng: () => number, maxPaise: number): string {
  const bucket = rng();
  if (bucket < 0.08) return '0.00';
  const paise = Math.floor(rng() * maxPaise);
  return new Decimal(paise).dividedBy(100).toFixed(2);
}

function run() {
  console.log('================================================================================');
  console.log('SMART DAIRY — PHASE 6: PURE BILLING CALCULATION ENGINE TEST SUITE');
  console.log('================================================================================\n');

  // 1. Required table scenarios (verifying all output fields)
  const tableCases: Array<{
    name: string;
    milk: string;
    feed: string;
    advance: string;
    expected: BillingCalculationResult;
  }> = [
    {
      name: 'Feed greater (5000 / 7000 / 3000 -> 0)',
      milk: '5000',
      feed: '7000',
      advance: '3000',
      expected: {
        totalMilkAmount: '5000.00',
        totalFeedOutstanding: '7000.00',
        feedDeducted: '5000.00',
        remainingFeed: '2000.00',
        totalAdvanceOutstanding: '3000.00',
        advanceDeducted: '0.00',
        remainingAdvance: '3000.00',
        finalPayable: '0.00',
      },
    },
    {
      name: 'Feed smaller (10000 / 3000 / 2000 -> 5000)',
      milk: '10000',
      feed: '3000',
      advance: '2000',
      expected: {
        totalMilkAmount: '10000.00',
        totalFeedOutstanding: '3000.00',
        feedDeducted: '3000.00',
        remainingFeed: '0.00',
        totalAdvanceOutstanding: '2000.00',
        advanceDeducted: '2000.00',
        remainingAdvance: '0.00',
        finalPayable: '5000.00',
      },
    },
    {
      name: 'Advance greater (10000 / 2000 / 12000 -> 0)',
      milk: '10000',
      feed: '2000',
      advance: '12000',
      expected: {
        totalMilkAmount: '10000.00',
        totalFeedOutstanding: '2000.00',
        feedDeducted: '2000.00',
        remainingFeed: '0.00',
        totalAdvanceOutstanding: '12000.00',
        advanceDeducted: '8000.00',
        remainingAdvance: '4000.00',
        finalPayable: '0.00',
      },
    },
    {
      name: 'No feed (10000 / 0 / 2000 -> 8000)',
      milk: '10000',
      feed: '0',
      advance: '2000',
      expected: {
        totalMilkAmount: '10000.00',
        totalFeedOutstanding: '0.00',
        feedDeducted: '0.00',
        remainingFeed: '0.00',
        totalAdvanceOutstanding: '2000.00',
        advanceDeducted: '2000.00',
        remainingAdvance: '0.00',
        finalPayable: '8000.00',
      },
    },
    {
      name: 'No advance (10000 / 2000 / 0 -> 8000)',
      milk: '10000',
      feed: '2000',
      advance: '0',
      expected: {
        totalMilkAmount: '10000.00',
        totalFeedOutstanding: '2000.00',
        feedDeducted: '2000.00',
        remainingFeed: '0.00',
        totalAdvanceOutstanding: '0.00',
        advanceDeducted: '0.00',
        remainingAdvance: '0.00',
        finalPayable: '8000.00',
      },
    },
    {
      name: 'No dues (10000 / 0 / 0 -> 10000)',
      milk: '10000',
      feed: '0',
      advance: '0',
      expected: {
        totalMilkAmount: '10000.00',
        totalFeedOutstanding: '0.00',
        feedDeducted: '0.00',
        remainingFeed: '0.00',
        totalAdvanceOutstanding: '0.00',
        advanceDeducted: '0.00',
        remainingAdvance: '0.00',
        finalPayable: '10000.00',
      },
    },
    {
      name: 'Zero milk (0 / 3000 / 2000 -> 0)',
      milk: '0',
      feed: '3000',
      advance: '2000',
      expected: {
        totalMilkAmount: '0.00',
        totalFeedOutstanding: '3000.00',
        feedDeducted: '0.00',
        remainingFeed: '3000.00',
        totalAdvanceOutstanding: '2000.00',
        advanceDeducted: '0.00',
        remainingAdvance: '2000.00',
        finalPayable: '0.00',
      },
    },
    {
      name: 'Everything zero (0 / 0 / 0 -> 0)',
      milk: '0',
      feed: '0',
      advance: '0',
      expected: {
        totalMilkAmount: '0.00',
        totalFeedOutstanding: '0.00',
        feedDeducted: '0.00',
        remainingFeed: '0.00',
        totalAdvanceOutstanding: '0.00',
        advanceDeducted: '0.00',
        remainingAdvance: '0.00',
        finalPayable: '0.00',
      },
    },
  ];

  for (const tc of tableCases) {
    unitTest(`Table case: ${tc.name}`, () => {
      const res = BillingCalculationService.calculateSettlement({
        totalMilkAmount: tc.milk,
        totalFeedOutstanding: tc.feed,
        totalAdvanceOutstanding: tc.advance,
      });
      assert.deepStrictEqual(res, tc.expected);
      assertInvariants(res);
    });
  }

  // 2. Additional edge & boundary cases
  unitTest('Feed outstanding exactly equals milk amount', () => {
    const res = calculateBillingSettlement({
      totalMilkAmount: '4500.50',
      totalFeedOutstanding: '4500.50',
      totalAdvanceOutstanding: '1200.00',
    });
    assert.deepStrictEqual(res, {
      totalMilkAmount: '4500.50',
      totalFeedOutstanding: '4500.50',
      feedDeducted: '4500.50',
      remainingFeed: '0.00',
      totalAdvanceOutstanding: '1200.00',
      advanceDeducted: '0.00',
      remainingAdvance: '1200.00',
      finalPayable: '0.00',
    });
    assertInvariants(res);
  });

  unitTest('Advance outstanding exactly equals remaining milk', () => {
    const res = calculateBillingSettlement({
      totalMilkAmount: '6000.00',
      totalFeedOutstanding: '1500.25',
      totalAdvanceOutstanding: '4499.75',
    });
    assert.deepStrictEqual(res, {
      totalMilkAmount: '6000.00',
      totalFeedOutstanding: '1500.25',
      feedDeducted: '1500.25',
      remainingFeed: '0.00',
      totalAdvanceOutstanding: '4499.75',
      advanceDeducted: '4499.75',
      remainingAdvance: '0.00',
      finalPayable: '0.00',
    });
    assertInvariants(res);
  });

  unitTest('Both deductions partially consume respective outstanding balances (feed-first priority)', () => {
    // Milk = 5000, Feed = 4000 -> FeedDed = 4000, RemMilk = 1000, Adv = 2500 -> AdvDed = 1000, RemAdv = 1500
    // Notice if milk = 5000, feed = 6000, adv = 2500: feed consumes all milk, adv gets 0.
    // Partial feed only happens when milk < feed; partial advance when milk > feed and remainingMilk < advance.
    const res = calculateBillingSettlement({
      totalMilkAmount: '5000.00',
      totalFeedOutstanding: '3200.50',
      totalAdvanceOutstanding: '2500.75',
    });
    assert.strictEqual(res.feedDeducted, '3200.50');
    assert.strictEqual(res.remainingFeed, '0.00');
    assert.strictEqual(res.advanceDeducted, '1799.50');
    assert.strictEqual(res.remainingAdvance, '701.25');
    assert.strictEqual(res.finalPayable, '0.00');
    assertInvariants(res);
  });

  unitTest('Decimal inputs (e.g. 1250.75) avoid floating-point drift', () => {
    const res = calculateBillingSettlement({
      totalMilkAmount: '1250.75',
      totalFeedOutstanding: '0.30',
      totalAdvanceOutstanding: '0.15',
    });
    assert.strictEqual(res.feedDeducted, '0.30');
    assert.strictEqual(res.advanceDeducted, '0.15');
    assert.strictEqual(res.finalPayable, '1250.30');
    assertInvariants(res);
  });

  unitTest('Very large monetary values preserve exact precision', () => {
    const res = calculateBillingSettlement({
      totalMilkAmount: '999999999999999.99',
      totalFeedOutstanding: '123456789012345.67',
      totalAdvanceOutstanding: '111111111111111.11',
    });
    assert.strictEqual(res.feedDeducted, '123456789012345.67');
    assert.strictEqual(res.advanceDeducted, '111111111111111.11');
    assert.strictEqual(res.finalPayable, '765432099876543.21');
    assertInvariants(res);
  });

  // 3. Invalid input rejection tests
  const invalidInputs: Array<[string, any]> = [
    ['negative milk', { totalMilkAmount: '-100', totalFeedOutstanding: '0', totalAdvanceOutstanding: '0' }],
    ['negative feed', { totalMilkAmount: '100', totalFeedOutstanding: '-1', totalAdvanceOutstanding: '0' }],
    ['negative advance', { totalMilkAmount: '100', totalFeedOutstanding: '0', totalAdvanceOutstanding: '-0.01' }],
    ['empty string', { totalMilkAmount: '', totalFeedOutstanding: '0', totalAdvanceOutstanding: '0' }],
    ['whitespace string', { totalMilkAmount: ' 100 ', totalFeedOutstanding: '0', totalAdvanceOutstanding: '0' }],
    ['NaN string', { totalMilkAmount: 'NaN', totalFeedOutstanding: '0', totalAdvanceOutstanding: '0' }],
    ['Infinity string', { totalMilkAmount: 'Infinity', totalFeedOutstanding: '0', totalAdvanceOutstanding: '0' }],
    ['-Infinity string', { totalMilkAmount: '-Infinity', totalFeedOutstanding: '0', totalAdvanceOutstanding: '0' }],
    ['non-numeric string', { totalMilkAmount: 'abc', totalFeedOutstanding: '0', totalAdvanceOutstanding: '0' }],
    ['scientific notation', { totalMilkAmount: '1e5', totalFeedOutstanding: '0', totalAdvanceOutstanding: '0' }],
    ['excessive precision (3 decimals)', { totalMilkAmount: '100.123', totalFeedOutstanding: '0', totalAdvanceOutstanding: '0' }],
    ['trailing dot', { totalMilkAmount: '100.', totalFeedOutstanding: '0', totalAdvanceOutstanding: '0' }],
    ['leading dot', { totalMilkAmount: '.50', totalFeedOutstanding: '0', totalAdvanceOutstanding: '0' }],
    ['plus prefix', { totalMilkAmount: '+100', totalFeedOutstanding: '0', totalAdvanceOutstanding: '0' }],
    ['number instead of string', { totalMilkAmount: 100 as any, totalFeedOutstanding: '0', totalAdvanceOutstanding: '0' }],
  ];

  for (const [label, badInput] of invalidInputs) {
    unitTest(`Rejects invalid input: ${label}`, () => {
      assert.throws(() => calculateBillingSettlement(badInput), (err: any) => err.statusCode === 400);
    });
  }

  // 4. Property-based testing (1,000 reproducible random trials)
  console.log('\n--- Property-Based Tests (1,000 seeded trials, seed=0x5A17DA17) ---');
  const rng = createSeededRng(0x5a17da17);
  const TRIALS = 1000;
  let propFailures = 0;

  for (let i = 0; i < TRIALS; i++) {
    const scale = i % 10 === 0 ? 1000000000 : 5000000; // mix normal and large values
    const input = {
      totalMilkAmount: randomMonetaryString(rng, scale),
      totalFeedOutstanding: randomMonetaryString(rng, scale),
      totalAdvanceOutstanding: randomMonetaryString(rng, scale),
    };
    try {
      const res = calculateBillingSettlement(input);
      assertInvariants(res);

      // Verify exact 2-decimal normalized formatting
      for (const val of Object.values(res)) {
        assert.match(val, /^\d+\.\d{2}$/);
      }
    } catch (err: any) {
      propFailures++;
      console.error(`  [FAIL] Property trial #${i} (${JSON.stringify(input)}): ${err.message}`);
      break;
    }
  }

  if (propFailures === 0) {
    console.log(`  [PASS] All ${TRIALS} property-based trials satisfied all 7 financial invariants`);
  }

  console.log('\n================================================================================');
  console.log(`UNIT TESTS: ${unitPassed} passed, ${unitFailed} failed`);
  console.log(`PROPERTY TESTS: ${TRIALS - propFailures}/${TRIALS} passed`);
  console.log('================================================================================');

  if (unitFailed > 0 || propFailures > 0) {
    process.exit(1);
  }
}

run();

