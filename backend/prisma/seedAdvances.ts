import prisma from "../src/db/index.js";
import { createAdvance, addRepayment } from "../src/modules/Advance/advance.service.js";

const TARGET_MOBILE_PLAIN = "8767537562";
const TARGET_MOBILE_E164 = "+918767537562";

interface RecoverySpec {
  amount: number;
  notes: string;
}

interface SeedAdvanceSpec {
  customerCode: number;
  amount: number;
  givenDateIso: string;
  notes: string;
  recoveries: RecoverySpec[];
}

const SEED_ADVANCES: SeedAdvanceSpec[] = [
  // Farmer 101: Ramesh Patil (Multiple advances: Partially Recovered + New Active)
  {
    customerCode: 101,
    amount: 5000,
    givenDateIso: "2026-11-10T10:00:00.000Z",
    notes: "Seed Advance: Dairy cattle feed & shed repair",
    recoveries: [
      { amount: 1500, notes: "Recovery 1/2 - Partial cash deduction (2026-11-15)" },
      { amount: 1000, notes: "Recovery 2/2 - Partial milk bill adjustment (2026-11-22)" },
    ],
  },
  {
    customerCode: 101,
    amount: 2000,
    givenDateIso: "2026-11-24T11:30:00.000Z",
    notes: "Seed Advance: Emergency veterinary expense",
    recoveries: [], // Newly created, no recovery
  },

  // Farmer 102: Suresh Kulkarni (Almost fully recovered: ₹6,500 / ₹7,000)
  {
    customerCode: 102,
    amount: 7000,
    givenDateIso: "2026-11-08T09:15:00.000Z",
    notes: "Seed Advance: Milking equipment purchase",
    recoveries: [
      { amount: 2500, notes: "Recovery 1/3 - Weekly milk payout deduction (2026-11-14)" },
      { amount: 2500, notes: "Recovery 2/3 - Weekly milk payout deduction (2026-11-20)" },
      { amount: 1500, notes: "Recovery 3/3 - Cash repayment at desk (2026-11-25)" },
    ],
  },

  // Farmer 103: Mahesh Jadhav (Multiple advances: Fully Recovered + New Active)
  {
    customerCode: 103,
    amount: 3500,
    givenDateIso: "2026-11-05T08:30:00.000Z",
    notes: "Seed Advance: Fodder & silage procurement",
    recoveries: [
      { amount: 2000, notes: "Recovery 1/2 - Settlement deduction (2026-11-12)" },
      { amount: 1500, notes: "Recovery 2/2 - Final settlement recovery (2026-11-19)" },
    ],
  },
  {
    customerCode: 103,
    amount: 3000,
    givenDateIso: "2026-11-23T14:00:00.000Z",
    notes: "Seed Advance: Festival advance",
    recoveries: [], // Newly created, no recovery
  },

  // Farmer 104: Ganesh Shinde (Large advance, partially recovered)
  {
    customerCode: 104,
    amount: 10000,
    givenDateIso: "2026-11-12T10:45:00.000Z",
    notes: "Seed Advance: New cow purchase support",
    recoveries: [
      { amount: 3000, notes: "Recovery 1/2 - First installment recovery (2026-11-18)" },
      { amount: 2500, notes: "Recovery 2/2 - Second installment recovery (2026-11-24)" },
    ],
  },

  // Farmer 105: Prakash Deshmukh (Newly created, no recovery)
  {
    customerCode: 105,
    amount: 2000,
    givenDateIso: "2026-11-25T16:20:00.000Z",
    notes: "Seed Advance: Feed & supplement advance",
    recoveries: [],
  },

  // Farmer 106: Vitthal Pawar (Fully recovered)
  {
    customerCode: 106,
    amount: 5000,
    givenDateIso: "2026-11-07T09:00:00.000Z",
    notes: "Seed Advance: Chaff cutter maintenance",
    recoveries: [
      { amount: 3000, notes: "Recovery 1/2 - Cash recovery (2026-11-14)" },
      { amount: 2000, notes: "Recovery 2/2 - Final recovery (2026-11-21)" },
    ],
  },
];

async function main() {
  console.log("🔍 Looking up dairy admin with mobile 8767537562...");
  const admin = await prisma.admin.findFirst({
    where: {
      OR: [{ mobile: TARGET_MOBILE_PLAIN }, { mobile: TARGET_MOBILE_E164 }],
    },
  });

  if (!admin) {
    throw new Error(`Admin with mobile ${TARGET_MOBILE_PLAIN} not found.`);
  }

  const farmers = await prisma.customer.findMany({
    where: {
      adminId: admin.id,
      code: { in: [101, 102, 103, 104, 105, 106] },
    },
    orderBy: { code: "asc" },
  });

  if (farmers.length === 0) {
    throw new Error("Seeded farmers (101..106) not found. Run seedTestDairy.ts first.");
  }

  const farmerByCode = new Map(farmers.map((f) => [f.code, f]));

  let advancesCreated = 0;
  let advancesSkipped = 0;
  let recoveriesCreated = 0;
  let recoveriesSkipped = 0;

  for (const spec of SEED_ADVANCES) {
    const farmer = farmerByCode.get(spec.customerCode);
    if (!farmer) {
      throw new Error(`Farmer with code ${spec.customerCode} not found.`);
    }

    const givenDate = new Date(spec.givenDateIso);

    // 1. Idempotency check for advance record
    let advance = await prisma.advance.findFirst({
      where: {
        adminId: admin.id,
        customerId: farmer.id,
        givenDate,
        originalAmount: spec.amount,
      },
    });

    if (advance) {
      advancesSkipped++;
    } else {
      advance = await createAdvance(
        {
          customerId: farmer.id,
          amount: spec.amount,
          givenDate: spec.givenDateIso,
          notes: spec.notes,
        },
        admin.id
      );
      advancesCreated++;
    }

    // 2. Idempotently apply recovery transactions via addRepayment
    for (const rec of spec.recoveries) {
      const existingTx = await prisma.advanceTransaction.findFirst({
        where: {
          advanceId: advance.id,
          type: "MANUAL_REPAYMENT",
          notes: rec.notes,
        },
        select: { id: true },
      });

      if (existingTx) {
        recoveriesSkipped++;
        continue;
      }

      await addRepayment(
        advance.id,
        {
          amount: rec.amount,
          notes: rec.notes,
        },
        admin.id
      );
      recoveriesCreated++;
    }
  }

  console.log(`\n💳 Advances: ${advancesCreated} created, ${advancesSkipped} already existed.`);
  console.log(`🔁 Recoveries: ${recoveriesCreated} created, ${recoveriesSkipped} already existed.`);

  // 3. Verify every advance's math, status, and transaction history
  const allAdvances = await prisma.advance.findMany({
    where: {
      adminId: admin.id,
      customerId: { in: farmers.map((f) => f.id) },
    },
    include: {
      customer: { select: { code: true, name: true } },
      transactions: { orderBy: { createdAt: "asc" } },
    },
    orderBy: [{ customer: { code: "asc" } }, { givenDate: "asc" }],
  });

  let totalOriginal = 0;
  let totalRecovered = 0;
  let totalPending = 0;

  console.log("\n📋 Verified Advance Ledger Records:");
  for (const adv of allAdvances) {
    const orig = Number(adv.originalAmount);
    const rec = Number(adv.recoveredAmount);
    const pend = Number(adv.pendingAmount);

    if (Math.abs(orig - rec - pend) > 0.001) {
      throw new Error(
        `Balance mismatch on ${adv.advanceNumber}: ${orig} - ${rec} !== ${pend}`
      );
    }

    const expectedStatus =
      pend === 0 ? "CLOSED" : rec > 0 ? "PARTIALLY_RECOVERED" : "ACTIVE";
    if (adv.status !== expectedStatus) {
      throw new Error(
        `Status mismatch on ${adv.advanceNumber}: expected ${expectedStatus}, got ${adv.status}`
      );
    }

    totalOriginal += orig;
    totalRecovered += rec;
    totalPending += pend;

    const repayments = adv.transactions.filter((t) => t.type === "MANUAL_REPAYMENT");
    console.log(
      `   - ${adv.advanceNumber} | [${adv.customer.code}] ${adv.customer.name} | Orig=₹${orig.toFixed(2)} | Rec=₹${rec.toFixed(2)} | Rem=₹${pend.toFixed(2)} | Status=${adv.status} | Recoveries=${repayments.length}`
    );
  }

  console.log("\n💰 Advance Totals Summary:");
  console.log(`   Total Advances: ${allAdvances.length}`);
  console.log(`   Grand Original Amount: ₹${totalOriginal.toFixed(2)}`);
  console.log(`   Grand Recovered Amount: ₹${totalRecovered.toFixed(2)}`);
  console.log(`   Grand Remaining Balance: ₹${totalPending.toFixed(2)}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("❌ Advance seed failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });

