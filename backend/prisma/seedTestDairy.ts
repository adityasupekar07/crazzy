import prisma from "../src/db/index.js";
import { CollectionShift, MilkType } from "@prisma/client";
import { milkEntryService } from "../src/modules/milkEntry/milkEntry.service.js";
import {
  getIstStartOfDay,
  getIstEndOfDay,
  formatIstDate,
} from "../src/modules/rateChart/utils/dateUtils.js";

const TARGET_MOBILE_PLAIN = "8767537562";
const TARGET_MOBILE_E164 = "+918767537562";

const SEED_FARMERS = [
  {
    code: 101,
    name: "Ramesh Patil",
    mobile: "9822011101",
    address: "At Post Shirur, Tal. Shirur, Pune",
    milkType: MilkType.COW,
    baseQty: 14.5,
    baseFat: 3.8,
    baseSnf: 8.4,
  },
  {
    code: 102,
    name: "Suresh Kulkarni",
    mobile: "9822011102",
    address: "Plot 14, Baramati Road, Daund",
    milkType: MilkType.COW,
    baseQty: 18.0,
    baseFat: 4.1,
    baseSnf: 8.6,
  },
  {
    code: 103,
    name: "Mahesh Jadhav",
    mobile: "9822011103",
    address: "Near Vitthal Mandir, Indapur",
    milkType: MilkType.COW,
    baseQty: 11.5,
    baseFat: 3.6,
    baseSnf: 8.3,
  },
  {
    code: 104,
    name: "Ganesh Shinde",
    mobile: "9822011104",
    address: "Khed Shivapur, Tal. Haveli, Pune",
    milkType: MilkType.COW,
    baseQty: 21.0,
    baseFat: 4.3,
    baseSnf: 8.7,
  },
  {
    code: 105,
    name: "Prakash Deshmukh",
    mobile: "9822011105",
    address: "Pargaon Salu Malu, Tal. Daund",
    milkType: MilkType.COW,
    baseQty: 9.5,
    baseFat: 3.5,
    baseSnf: 8.2,
  },
  {
    code: 106,
    name: "Vitthal Pawar",
    mobile: "9822011106",
    address: "Loni Kalbhor, Tal. Haveli, Pune",
    milkType: MilkType.COW,
    baseQty: 16.0,
    baseFat: 4.0,
    baseSnf: 8.5,
  },
];

/**
 * Computes a deterministic IST timestamp for `daysAgo` at the given IST hour/minute.
 */
function getIstCollectionTimestamp(daysAgo: number, istHour: number, istMinute: number): Date {
  const now = new Date();
  const todayIstStr = formatIstDate(now); // YYYY-MM-DD in IST
  const [y, m, d] = todayIstStr.split("-").map(Number);
  // 00:00 IST is previous UTC day 18:30, so use Date.UTC and subtract 5h30m, then add hour/min
  const utcMidnight = Date.UTC(y, m - 1, d - daysAgo, 0, 0, 0, 0);
  const istMidnightMs = utcMidnight - (5 * 60 + 30) * 60 * 1000;
  return new Date(istMidnightMs + (istHour * 60 + istMinute) * 60 * 1000);
}

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

  console.log(`✅ Found Dairy Admin: ${admin.ownerName} (${admin.dairyName}) [ID: ${admin.id}]`);

  let farmersCreated = 0;
  let farmersExisting = 0;
  const resolvedFarmers: Array<{
    id: string;
    code: number;
    name: string;
    mobile: string;
    milkType: MilkType;
    baseQty: number;
    baseFat: number;
    baseSnf: number;
  }> = [];

  // 1. Idempotently create 6 farmers inside a transaction check
  for (const spec of SEED_FARMERS) {
    const existing = await prisma.customer.findFirst({
      where: {
        adminId: admin.id,
        OR: [{ code: spec.code }, { mobile: spec.mobile }],
      },
    });

    if (existing) {
      farmersExisting++;
      resolvedFarmers.push({
        id: existing.id,
        code: existing.code,
        name: existing.name,
        mobile: existing.mobile,
        milkType: existing.milkType,
        baseQty: spec.baseQty,
        baseFat: spec.baseFat,
        baseSnf: spec.baseSnf,
      });
    } else {
      const created = await prisma.customer.create({
        data: {
          adminId: admin.id,
          code: spec.code,
          name: spec.name,
          mobile: spec.mobile,
          address: spec.address,
          milkType: spec.milkType,
          isActive: true,
        },
      });
      farmersCreated++;
      resolvedFarmers.push({
        id: created.id,
        code: created.code,
        name: created.name,
        mobile: created.mobile,
        milkType: created.milkType,
        baseQty: spec.baseQty,
        baseFat: spec.baseFat,
        baseSnf: spec.baseSnf,
      });
    }
  }

  console.log(`👨‍🌾 Farmers: ${farmersCreated} created, ${farmersExisting} already existed.`);

  // 2. Seed 14 days of Morning & Evening milk entries using MilkEntryService (authoritative rate calculation)
  let entriesCreated = 0;
  let entriesSkipped = 0;
  let totalLitres = 0;
  let totalPayout = 0;

  const shifts: Array<{ shift: CollectionShift; hour: number; minute: number; qtyFactor: number; fatDelta: number }> = [
    { shift: CollectionShift.MORNING, hour: 7, minute: 15, qtyFactor: 1.0, fatDelta: 0.0 },
    { shift: CollectionShift.EVENING, hour: 18, minute: 30, qtyFactor: 0.85, fatDelta: 0.1 },
  ];

  for (const farmer of resolvedFarmers) {
    for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
      for (const s of shifts) {
        const collectionDate = getIstCollectionTimestamp(daysAgo, s.hour, s.minute);
        const istStart = getIstStartOfDay(collectionDate);
        const istEnd = getIstEndOfDay(collectionDate);

        // Idempotency check: skip if entry already exists for (farmer, shift, IST day)
        const existingEntry = await prisma.milkEntry.findFirst({
          where: {
            customerId: farmer.id,
            shift: s.shift,
            date: {
              gte: istStart,
              lte: istEnd,
            },
          },
          select: { id: true },
        });

        if (existingEntry) {
          entriesSkipped++;
          continue;
        }

        // Deterministic realistic variation per farmer + day + shift
        const dayWave = ((daysAgo + farmer.code) % 5) - 2; // -2..+2
        const qty = Number((farmer.baseQty * s.qtyFactor + dayWave * 0.4).toFixed(1));
        const fat = Number(Math.min(4.9, Math.max(3.1, farmer.baseFat + s.fatDelta + dayWave * 0.1)).toFixed(1));
        const snf = Number(Math.min(9.1, Math.max(8.1, farmer.baseSnf + (dayWave % 2) * 0.1)).toFixed(1));

        const saved = await milkEntryService.createMilkEntry(admin.id, {
          customerId: farmer.id,
          milkType: farmer.milkType,
          shift: s.shift,
          date: collectionDate.toISOString(),
          quantity: qty,
          fat,
          snf,
        });

        entriesCreated++;
        totalLitres += Number(saved.quantity);
        totalPayout += Number(saved.totalAmount || 0);
      }
    }
  }

  console.log("\n📊 Seed Summary:");
  console.log(`   Dairy: ${admin.dairyName} (${admin.mobile})`);
  console.log(`   Farmers Created: ${farmersCreated} | Existing Skipped: ${farmersExisting}`);
  console.log(`   Milk Entries Created: ${entriesCreated} | Existing Skipped: ${entriesSkipped}`);
  console.log(`   Newly Seeded Volume: ${totalLitres.toFixed(1)} L | Amount: ₹${totalPayout.toFixed(2)}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("❌ Seed failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
