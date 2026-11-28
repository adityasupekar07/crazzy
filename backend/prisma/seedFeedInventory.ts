import prisma from "../src/db/index.js";
import { createFoodDealer } from "../src/modules/foodDealers/foodDealer.service.js";
import { createFoodPurchase } from "../src/modules/foodPurchases/foodPurchase.service.js";

const TARGET_MOBILE_PLAIN = "8767537562";
const TARGET_MOBILE_E164 = "+918767537562";

const SEED_DEALERS = [
  {
    code: "FD-101",
    name: "Sahyadri Agro Feeds",
    phone: "9823044101",
    address: "MIDC Baramati, Dist. Pune",
    isActive: true,
  },
  {
    code: "FD-102",
    name: "Kisan Cattle Nutrition",
    phone: "9823044102",
    address: "Market Yard, Daund, Dist. Pune",
    isActive: true,
  },
  {
    code: "FD-103",
    name: "Mahalaxmi Oil & Cake Mills",
    phone: "9823044103",
    address: "Shirur Phata, NH-65, Pune",
    isActive: true,
  },
  {
    code: "FD-104",
    name: "Nandini Mineral & Supplements",
    phone: "9823044104",
    address: "Indapur Road, Bhigwan",
    isActive: true,
  },
];

interface SeedPurchaseSpec {
  dealerCode: string;
  foodName: string;
  quantity: number;
  buyRate: number;
  sellRate: number;
  amountPaid: number;
  purchaseDateIso: string;
}

const SEED_PURCHASES: SeedPurchaseSpec[] = [
  {
    dealerCode: "FD-101",
    foodName: "Cattle Feed Pellets (50kg Bag)",
    quantity: 40,
    buyRate: 1250,
    sellRate: 1350,
    amountPaid: 50000, // Fully Paid
    purchaseDateIso: "2026-11-14T10:00:00.000Z",
  },
  {
    dealerCode: "FD-103",
    foodName: "Cotton Seed Cake (50kg Bag)",
    quantity: 30,
    buyRate: 1650,
    sellRate: 1780,
    amountPaid: 30000, // Partial (Pending 19500)
    purchaseDateIso: "2026-11-16T11:30:00.000Z",
  },
  {
    dealerCode: "FD-103",
    foodName: "Soybean Meal (50kg Bag)",
    quantity: 20,
    buyRate: 2400,
    sellRate: 2550,
    amountPaid: 48000, // Fully Paid
    purchaseDateIso: "2026-11-18T09:15:00.000Z",
  },
  {
    dealerCode: "FD-104",
    foodName: "Chelated Mineral Mixture (5kg Pack)",
    quantity: 25,
    buyRate: 420,
    sellRate: 480,
    amountPaid: 0, // Unpaid / Credit (Pending 10500)
    purchaseDateIso: "2026-11-19T14:20:00.000Z",
  },
  {
    dealerCode: "FD-102",
    foodName: "Crushed Maize / Corn (50kg Bag)",
    quantity: 35,
    buyRate: 1180,
    sellRate: 1280,
    amountPaid: 25000, // Partial (Pending 16300)
    purchaseDateIso: "2026-11-21T10:45:00.000Z",
  },
  {
    dealerCode: "FD-104",
    foodName: "Bypass Fat & Calcium Supplement (10kg)",
    quantity: 15,
    buyRate: 950,
    sellRate: 1050,
    amountPaid: 14250, // Fully Paid
    purchaseDateIso: "2026-11-23T16:00:00.000Z",
  },
  {
    dealerCode: "FD-102",
    foodName: "Cattle Feed Pellets (50kg Bag)",
    quantity: 25,
    buyRate: 1260,
    sellRate: 1350,
    amountPaid: 15000, // Partial (Pending 16500)
    purchaseDateIso: "2026-11-24T12:10:00.000Z",
  },
  {
    dealerCode: "FD-101",
    foodName: "Cotton Seed Cake (50kg Bag)",
    quantity: 20,
    buyRate: 1680,
    sellRate: 1780,
    amountPaid: 33600, // Fully Paid
    purchaseDateIso: "2026-11-25T15:00:00.000Z",
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

  console.log(`✅ Found Dairy Admin: ${admin.ownerName} (${admin.dairyName}) [ID: ${admin.id}]`);

  // 1. Idempotently create feed dealers via foodDealer.service
  const dealerMap = new Map<string, string>();
  let dealersCreated = 0;
  let dealersSkipped = 0;

  for (const d of SEED_DEALERS) {
    const existing = await prisma.foodDealer.findFirst({
      where: { adminId: admin.id, code: d.code },
    });

    if (existing) {
      dealersSkipped++;
      dealerMap.set(d.code, existing.id);
    } else {
      const created = await createFoodDealer(admin.id, d);
      dealersCreated++;
      dealerMap.set(d.code, created.id);
    }
  }

  console.log(`🏪 Feed Dealers: ${dealersCreated} created, ${dealersSkipped} already existed.`);

  // 2. Idempotently create feed purchases via foodPurchase.service
  let purchasesCreated = 0;
  let purchasesSkipped = 0;

  for (const p of SEED_PURCHASES) {
    const dealerId = dealerMap.get(p.dealerCode);
    if (!dealerId) {
      throw new Error(`Missing dealer ID for code ${p.dealerCode}`);
    }

    const purchaseDate = new Date(p.purchaseDateIso);
    const existing = await prisma.foodPurchase.findFirst({
      where: {
        adminId: admin.id,
        dealerId,
        foodName: p.foodName,
        purchaseDate,
      },
      select: { id: true },
    });

    if (existing) {
      purchasesSkipped++;
      continue;
    }

    await createFoodPurchase(admin.id, {
      dealerId,
      foodName: p.foodName,
      quantity: p.quantity,
      buyRate: p.buyRate,
      sellRate: p.sellRate,
      amountPaid: p.amountPaid,
      purchaseDate: p.purchaseDateIso,
    });
    purchasesCreated++;
  }

  console.log(`📦 Feed Purchases: ${purchasesCreated} created, ${purchasesSkipped} already existed.`);

  // 3. Verify inventory quantities and purchase totals
  const allPurchases = await prisma.foodPurchase.findMany({
    where: { adminId: admin.id },
    include: { dealer: { select: { code: true, name: true } } },
    orderBy: { purchaseDate: "asc" },
  });

  const stockByProduct = new Map<string, { purchased: number; remaining: number; value: number }>();
  let grandTotalAmount = 0;
  let grandTotalPaid = 0;
  let grandPending = 0;

  for (const row of allPurchases) {
    grandTotalAmount += row.totalAmount;
    grandTotalPaid += row.amountPaid;
    grandPending += row.pendingAmount;

    const curr = stockByProduct.get(row.foodName) || { purchased: 0, remaining: 0, value: 0 };
    curr.purchased += row.quantity;
    curr.remaining += row.remainingQuantity;
    curr.value += row.totalAmount;
    stockByProduct.set(row.foodName, curr);
  }

  console.log("\n📊 Inventory Summary by Product:");
  for (const [product, stats] of stockByProduct.entries()) {
    console.log(
      `   - ${product}: Purchased=${stats.purchased}, Remaining Stock=${stats.remaining}, Value=₹${stats.value.toFixed(2)}`
    );
  }

  console.log("\n💰 Purchase Totals:");
  console.log(`   Total Purchases: ${allPurchases.length}`);
  console.log(`   Grand Total Amount: ₹${grandTotalAmount.toFixed(2)}`);
  console.log(`   Total Paid: ₹${grandTotalPaid.toFixed(2)}`);
  console.log(`   Total Remaining Payable: ₹${grandPending.toFixed(2)}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("❌ Feed seed failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });

