import assert from 'assert';
import {
  ReconciliationService,
  ReconcilableSettlementSnapshot,
} from '../modules/billing/services/reconciliation.service.js';

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

function baseValidSettlement(): ReconcilableSettlementSnapshot {
  return {
    id: 'set-1',
    settlementNumber: 'SET-001',
    customerId: 'farmer-1',
    grossMilkAmount: '10000.00',
    previousFeedPending: '3000.00',
    feedDeductionAmount: '3000.00',
    remainingFeedBalance: '0.00',
    previousAdvancePending: '2000.00',
    advanceDeductionAmount: '2000.00',
    remainingAdvanceBalance: '0.00',
    netPayableAmount: '5000.00',
    milkEntries: [{ milkEntryId: 'm1', totalAmount: '10000.00' }],
    feedAllocations: [
      {
        foodSaleId: 'fs1',
        previousPendingAmount: '3000.00',
        allocatedAmount: '3000.00',
        remainingPendingAmount: '0.00',
      },
    ],
    advanceAllocations: [
      {
        advanceId: 'adv1',
        previousPendingAmount: '2000.00',
        allocatedAmount: '2000.00',
        remainingPendingAmount: '0.00',
      },
    ],
    ledgerEntry: {
      grossMilkAmount: '10000.00',
      totalDeductions: '5000.00',
      netPayableAmount: '5000.00',
      remainingFeedBalance: '0.00',
      remainingAdvanceBalance: '0.00',
    },
  };
}

function run() {
  console.log('================================================================================');
  console.log('SMART DAIRY — PHASE 12: FINANCIAL RECONCILIATION TEST SUITE');
  console.log('================================================================================\n');

  test('1 & 2 & 4: Fully reconciled settlement with full feed & advance allocation passes', () => {
    const report = ReconciliationService.reconcileSettlement(baseValidSettlement());
    assert.strictEqual(report.isReconciled, true);
    assert.strictEqual(report.discrepancies.length, 0);
  });

  test('3 & 5: Partially allocated feed and advance pass reconciliation', () => {
    const s = baseValidSettlement();
    s.grossMilkAmount = '5000.00';
    s.previousFeedPending = '4000.00';
    s.feedDeductionAmount = '4000.00';
    s.remainingFeedBalance = '0.00';
    s.previousAdvancePending = '3000.00';
    s.advanceDeductionAmount = '1000.00';
    s.remainingAdvanceBalance = '2000.00';
    s.netPayableAmount = '0.00';
    s.milkEntries = [{ milkEntryId: 'm1', totalAmount: '5000.00' }];
    s.feedAllocations = [
      {
        foodSaleId: 'fs1',
        previousPendingAmount: '4000.00',
        allocatedAmount: '4000.00',
        remainingPendingAmount: '0.00',
      },
    ];
    s.advanceAllocations = [
      {
        advanceId: 'adv1',
        previousPendingAmount: '3000.00',
        allocatedAmount: '1000.00',
        remainingPendingAmount: '2000.00',
      },
    ];
    s.ledgerEntry = {
      grossMilkAmount: '5000.00',
      totalDeductions: '5000.00',
      netPayableAmount: '0.00',
      remainingFeedBalance: '0.00',
      remainingAdvanceBalance: '2000.00',
    };

    const report = ReconciliationService.reconcileSettlement(s);
    assert.strictEqual(report.isReconciled, true);
  });

  test('6: Detects incorrect net payable', () => {
    const s = baseValidSettlement();
    s.netPayableAmount = '4999.00';
    const report = ReconciliationService.reconcileSettlement(s);
    assert.strictEqual(report.isReconciled, false);
    assert(report.discrepancies.some((d) => d.code === 'SETTLEMENT_EQUATION_MISMATCH'));
  });

  test('7: Detects feed over-allocation', () => {
    const s = baseValidSettlement();
    s.feedAllocations[0].allocatedAmount = '3500.00';
    const report = ReconciliationService.reconcileSettlement(s);
    assert.strictEqual(report.isReconciled, false);
    assert(report.discrepancies.some((d) => d.code === 'FEED_OVER_ALLOCATION'));
  });

  test('8: Detects advance over-allocation', () => {
    const s = baseValidSettlement();
    s.advanceAllocations[0].allocatedAmount = '2500.00';
    const report = ReconciliationService.reconcileSettlement(s);
    assert.strictEqual(report.isReconciled, false);
    assert(report.discrepancies.some((d) => d.code === 'ADVANCE_OVER_ALLOCATION'));
  });

  test('9: Detects negative remaining feed balance', () => {
    const s = baseValidSettlement();
    s.remainingFeedBalance = '-10.00';
    const report = ReconciliationService.reconcileSettlement(s);
    assert.strictEqual(report.isReconciled, false);
    assert(report.discrepancies.some((d) => d.code === 'NEGATIVE_REMAINING_FEED'));
  });

  test('10: Detects negative remaining advance balance', () => {
    const s = baseValidSettlement();
    s.remainingAdvanceBalance = '-5.00';
    const report = ReconciliationService.reconcileSettlement(s);
    assert.strictEqual(report.isReconciled, false);
    assert(report.discrepancies.some((d) => d.code === 'NEGATIVE_REMAINING_ADVANCE'));
  });

  test('11: Detects duplicate feed and advance allocations', () => {
    const s = baseValidSettlement();
    s.feedAllocations.push({ ...s.feedAllocations[0] });
    s.advanceAllocations.push({ ...s.advanceAllocations[0] });
    const report = ReconciliationService.reconcileSettlement(s);
    assert.strictEqual(report.isReconciled, false);
    assert(report.discrepancies.some((d) => d.code === 'DUPLICATE_FEED_ALLOCATION'));
    assert(report.discrepancies.some((d) => d.code === 'DUPLICATE_ADVANCE_ALLOCATION'));
  });

  test('12: Detects missing allocation record', () => {
    const s = baseValidSettlement();
    s.feedAllocations = [];
    const report = ReconciliationService.reconcileSettlement(s);
    assert.strictEqual(report.isReconciled, false);
    assert(report.discrepancies.some((d) => d.code === 'MISSING_FEED_ALLOCATION'));
  });

  test('13: Detects ledger and settlement snapshot mismatch and missing ledger', () => {
    const s1 = baseValidSettlement();
    s1.ledgerEntry!.netPayableAmount = '4500.00';
    const r1 = ReconciliationService.reconcileSettlement(s1);
    assert(r1.discrepancies.some((d) => d.code === 'LEDGER_SNAPSHOT_MISMATCH'));

    const s2 = baseValidSettlement();
    s2.ledgerEntry = null;
    const r2 = ReconciliationService.reconcileSettlement(s2);
    assert(r2.discrepancies.some((d) => d.code === 'LEDGER_ENTRY_MISSING'));
  });

  test('14: Detects carry-forward balance mismatch', () => {
    const s = baseValidSettlement();
    s.remainingFeedBalance = '500.00';
    const report = ReconciliationService.reconcileSettlement(s);
    assert(report.discrepancies.some((d) => d.code === 'FEED_CARRY_FORWARD_MISMATCH'));
  });

  test('15: Zero-value financial transactions pass reconciliation cleanly', () => {
    const report = ReconciliationService.reconcileSettlement({
      id: 'set-zero',
      settlementNumber: 'SET-ZERO',
      customerId: 'farmer-zero',
      grossMilkAmount: '0.00',
      previousFeedPending: '0.00',
      feedDeductionAmount: '0.00',
      remainingFeedBalance: '0.00',
      previousAdvancePending: '0.00',
      advanceDeductionAmount: '0.00',
      remainingAdvanceBalance: '0.00',
      netPayableAmount: '0.00',
      milkEntries: [{ milkEntryId: 'm0', totalAmount: '0.00' }],
      feedAllocations: [],
      advanceAllocations: [],
      ledgerEntry: {
        grossMilkAmount: '0.00',
        totalDeductions: '0.00',
        netPayableAmount: '0.00',
        remainingFeedBalance: '0.00',
        remainingAdvanceBalance: '0.00',
      },
    });
    assert.strictEqual(report.isReconciled, true);
  });

  console.log('\n================================================================================');
  console.log(`PHASE 12 RECONCILIATION TESTS: TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================================');
  if (failed > 0) process.exit(1);
}

run();

