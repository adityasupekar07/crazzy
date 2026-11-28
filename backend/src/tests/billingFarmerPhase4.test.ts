import assert from 'assert';
import prisma from '../db/index.js';
import { FarmerSelectorService } from '../modules/billing/services/farmer-selector.service.js';
import { billingFarmersQuerySchema } from '../modules/billing/validators/billing.schema.js';

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
  console.log('SMART DAIRY — PHASE 4: FARMER SELECTION & SEARCH TEST SUITE');
  console.log('================================================================================\n');

  const admin = await prisma.admin.findFirst({
    where: { OR: [{ mobile: '8767537562' }, { mobile: '+918767537562' }] },
  });
  assert(admin, 'Target test dairy admin 8767537562 must exist');

  const otherAdmin = await prisma.admin.findFirst({
    where: { id: { not: admin.id } },
  });

  await test('Test 1: Search by farmer name returns matching farmer with balances', async () => {
    const res = await FarmerSelectorService.listFarmersForBilling(admin.id, {
      search: 'Ramesh',
      page: 1,
      limit: 20,
    });
    assert.strictEqual(res.farmers.length, 1);
    assert.strictEqual(res.farmers[0].code, 101);
    assert.strictEqual(res.farmers[0].name, 'Ramesh Patil');
    assert.strictEqual(res.farmers[0].isActive, true);
    assert.strictEqual(res.farmers[0].outstandingFeedAmount, '2740.00');
    assert.strictEqual(res.farmers[0].outstandingAdvanceAmount, '4500.00');
  });

  await test('Test 2: Search by mobile number returns exact match', async () => {
    const res = await FarmerSelectorService.listFarmersForBilling(admin.id, {
      search: '9822011102',
      page: 1,
      limit: 20,
    });
    assert.strictEqual(res.farmers.length, 1);
    assert.strictEqual(res.farmers[0].name, 'Suresh Kulkarni');
    assert.strictEqual(res.farmers[0].outstandingFeedAmount, '7530.00');
    assert.strictEqual(res.farmers[0].outstandingAdvanceAmount, '500.00');
  });

  await test('Test 3: Search by farmer code returns matching farmer', async () => {
    const res = await FarmerSelectorService.listFarmersForBilling(admin.id, {
      search: '103',
      page: 1,
      limit: 20,
    });
    assert.strictEqual(res.farmers.length, 1);
    assert.strictEqual(res.farmers[0].name, 'Mahesh Jadhav');
    assert.strictEqual(res.farmers[0].outstandingFeedAmount, '2560.00');
    assert.strictEqual(res.farmers[0].outstandingAdvanceAmount, '3000.00');
  });

  await test('Test 4: Server-side pagination returns accurate pages and totals', async () => {
    const p1 = await FarmerSelectorService.listFarmersForBilling(admin.id, { page: 1, limit: 3 });
    const p2 = await FarmerSelectorService.listFarmersForBilling(admin.id, { page: 2, limit: 3 });
    assert.strictEqual(p1.farmers.length, 3);
    assert.strictEqual(p1.pagination.page, 1);
    assert.strictEqual(p1.pagination.limit, 3);
    assert(p1.pagination.total >= 8);
    assert.notStrictEqual(p1.farmers[0].id, p2.farmers[0].id);
  });

  await test('Test 5: Dairy-level tenant isolation prevents cross-dairy exposure', async () => {
    assert(otherAdmin, 'A second admin must exist for isolation check');
    const res = await FarmerSelectorService.listFarmersForBilling(otherAdmin.id, {
      search: '9822011101',
      page: 1,
      limit: 20,
    });
    assert.strictEqual(res.farmers.length, 0);
  });

  await test('Test 6: Query schema enforces valid page and max limit (100)', () => {
    assert.throws(() => billingFarmersQuerySchema.parse({ page: '0', limit: '20' }));
    assert.throws(() => billingFarmersQuerySchema.parse({ page: '1', limit: '101' }));
    const ok = billingFarmersQuerySchema.parse({});
    assert.strictEqual(ok.page, 1);
    assert.strictEqual(ok.limit, 20);
  });

  console.log('\n================================================================================');
  console.log(`PHASE 4 TEST RESULTS: TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================================');
  if (failed > 0) process.exit(1);
}

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

