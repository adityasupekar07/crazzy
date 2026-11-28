import assert from 'assert';
import { BillingCycleService } from '../modules/billing/services/billing-cycle.service.js';

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

console.log('================================================================================');
console.log('SMART DAIRY — PHASE 3: PAYMENT CYCLE UNIT & VALIDATION TEST SUITE');
console.log('================================================================================\n');

test('Test 1: getSupportedCycles returns TEN_DAY, FIFTEEN_DAY, MONTHLY, CUSTOM', () => {
  const res = BillingCycleService.getSupportedCycles('admin-1');
  assert.deepStrictEqual(
    res.cycles.map((c) => c.type),
    ['TEN_DAY', 'FIFTEEN_DAY', 'MONTHLY', 'CUSTOM']
  );
});

test('Test 2: TEN_DAY resolves 1-10, 11-20, 21-lastDay (non-leap Feb 2026)', () => {
  const ref = new Date('2026-02-25T10:00:00+05:30');
  const c0 = BillingCycleService.resolveCycleWindow({ type: 'TEN_DAY', offset: 0, referenceDate: ref });
  assert.strictEqual(c0.startDate, '2026-02-21');
  assert.strictEqual(c0.endDate, '2026-02-28');

  const cPrev1 = BillingCycleService.resolveCycleWindow({ type: 'TEN_DAY', offset: -1, referenceDate: ref });
  assert.strictEqual(cPrev1.startDate, '2026-02-11');
  assert.strictEqual(cPrev1.endDate, '2026-02-20');

  const cPrev2 = BillingCycleService.resolveCycleWindow({ type: 'TEN_DAY', offset: -2, referenceDate: ref });
  assert.strictEqual(cPrev2.startDate, '2026-02-01');
  assert.strictEqual(cPrev2.endDate, '2026-02-10');

  const cPrev3 = BillingCycleService.resolveCycleWindow({ type: 'TEN_DAY', offset: -3, referenceDate: ref });
  assert.strictEqual(cPrev3.startDate, '2026-01-21');
  assert.strictEqual(cPrev3.endDate, '2026-01-31');
});

test('Test 3: TEN_DAY handles leap-year February (2024-02-29)', () => {
  const ref = new Date('2024-02-22T10:00:00+05:30');
  const c0 = BillingCycleService.resolveCycleWindow({ type: 'TEN_DAY', offset: 0, referenceDate: ref });
  assert.strictEqual(c0.startDate, '2024-02-21');
  assert.strictEqual(c0.endDate, '2024-02-29');
});

test('Test 4: FIFTEEN_DAY resolves 1-15 and 16-lastDay across year boundary', () => {
  const ref = new Date('2026-01-05T10:00:00+05:30');
  const c0 = BillingCycleService.resolveCycleWindow({ type: 'FIFTEEN_DAY', offset: 0, referenceDate: ref });
  assert.strictEqual(c0.startDate, '2026-01-01');
  assert.strictEqual(c0.endDate, '2026-01-15');

  const cPrev = BillingCycleService.resolveCycleWindow({ type: 'FIFTEEN_DAY', offset: -1, referenceDate: ref });
  assert.strictEqual(cPrev.startDate, '2025-12-16');
  assert.strictEqual(cPrev.endDate, '2025-12-31');
});

test('Test 5: MONTHLY resolves 1st to last day of month', () => {
  const ref = new Date('2026-05-18T10:00:00+05:30');
  const c0 = BillingCycleService.resolveCycleWindow({ type: 'MONTHLY', offset: 0, referenceDate: ref });
  assert.strictEqual(c0.startDate, '2026-05-01');
  assert.strictEqual(c0.endDate, '2026-05-31');

  const cPrev = BillingCycleService.resolveCycleWindow({ type: 'MONTHLY', offset: -1, referenceDate: ref });
  assert.strictEqual(cPrev.startDate, '2026-04-01');
  assert.strictEqual(cPrev.endDate, '2026-04-30');
});

test('Test 6: CUSTOM rejects startDate > endDate', () => {
  assert.throws(
    () =>
      BillingCycleService.resolveCycleWindow({
        type: 'CUSTOM',
        startDate: '2026-11-20',
        endDate: '2026-11-10',
        referenceDate: new Date('2026-11-28T10:00:00+05:30'),
      }),
    /Start date must be before or equal to end date/
  );
});

test('Test 7: Rejects future billing periods by default', () => {
  const ref = new Date('2026-11-28T10:00:00+05:30');
  assert.throws(
    () =>
      BillingCycleService.resolveCycleWindow({
        type: 'CUSTOM',
        startDate: '2026-11-25',
        endDate: '2026-12-05',
        referenceDate: ref,
      }),
    /Future billing periods are not allowed/
  );

  assert.throws(
    () =>
      BillingCycleService.resolveCycleWindow({
        type: 'MONTHLY',
        offset: 1,
        referenceDate: ref,
      }),
    /Future billing periods are not allowed/
  );
});

test('Test 8: Rejects invalid calendar date (e.g., 2026-02-30)', () => {
  assert.throws(
    () =>
      BillingCycleService.resolveCycleWindow({
        type: 'CUSTOM',
        startDate: '2026-02-01',
        endDate: '2026-02-30',
        referenceDate: new Date('2026-11-28T10:00:00+05:30'),
      }),
    /Invalid calendar date/
  );
});

console.log('\n================================================================================');
console.log(`PHASE 3 TEST RESULTS: TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('================================================================================');
if (failed > 0) process.exit(1);

