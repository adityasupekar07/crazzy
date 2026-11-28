import prisma from "../src/db/index.js";
import { createFoodSale } from "../src/modules/foodSales/foodSale.service.js";

const TARGET_MOBILE_PLAIN = "8767537562";
const TARGET_MOBILE_E164 = "+918767537562";

type PaymentStatusType = "PAID" | "PARTIAL" | "CREDIT";

interface SeedSaleSpec {
  customerCode: number;
  foodName: string;
  quantity: number;
  paymentType: PaymentStatusType;
  partialRatio?: number;
  saleDateIso: string;
}

const SEED_SALES: SeedSaleSpec[] = [
  // Farmer 101: Ramesh Patil (3 sales)
  {
    customerCode: 101,
    foodName: "Cattle Feed Pellets (50kg Bag)",
    quantity: 3,
    paymentType: "PAID",
    saleDateIso: "2026-11-16T09:00:00.000Z",
  },
  {
    customerCode: 101,
    foodName: "Cotton Seed Cake (50kg Bag)",
    quantity: 2,
    paymentType: "PARTIAL",
    partialRatio: 0.5,
    saleDateIso: "2026-11-20T10:30:00.000Z",
  },
  {
    customerCode: 101,
    foodName: "Chelated Mineral Mixture (5kg Pack)",
    quantity: 2,
    paymentType: "CREDIT",
    saleDateIso: "2026-11-24T11:15:00.000Z",
  },

  // Farmer 102: Suresh Kulkarni (3 sales)
  {
    customerCode: 102,
    foodName: "Cattle Feed Pellets (50kg Bag)",
    quantity: 3,
    paymentType: "PARTIAL",
    partialRatio: 0.4,
    saleDateIso: "2026-11-17T08:45:00.000Z",
  },
  {
    customerCode: 102,
    foodName: "Soybean Meal (50kg Bag)",
    quantity: 2,
    paymentType: "CREDIT",
    saleDateIso: "2026-11-21T15:00:00.000Z",
  },
  {
    customerCode: 102,
    foodName: "Bypass Fat & Calcium Supplement (10kg)",
    quantity: 1,
    paymentType: "PAID",
    saleDateIso: "2026-11-25T09:20:00.000Z",
  },

  // Farmer 103: Mahesh Jadhav (3 sales)
  {
    customerCode: 103,
    foodName: "Cotton Seed Cake (50kg Bag)",
    quantity: 2,
    paymentType: "PAID",
    saleDateIso: "2026-11-18T10:00:00.000Z",
  },
  {
    customerCode: 103,
    foodName: "Crushed Maize / Corn (50kg Bag)",
    quantity: 2,
    paymentType: "CREDIT",
    saleDateIso: "2026-11-22T11:40:00.000Z",
  },
  {
    customerCode: 103,
    foodName: "Chelated Mineral Mixture (5kg Pack)",
    quantity: 1,
    paymentType: "PAID",
    saleDateIso: "2026-11-25T16:10:00.000Z",
  },

  // Farmer 104: Ganesh Shinde (3 sales)
  {
    customerCode: 104,
    foodName: "Cattle Feed Pellets (50kg Bag)",
    quantity: 4,
    paymentType: "PAID",
    saleDateIso: "2026-11-16T14:00:00.000Z",
  },
  {
    customerCode: 104,
    foodName: "Soybean Meal (50kg Bag)",
    quantity: 1,
    paymentType: "PARTIAL",
    partialRatio: 0.6,
    saleDateIso: "2026-11-21T09:30:00.000Z",
  },
  {
    customerCode: 104,
    foodName: "Bypass Fat & Calcium Supplement (10kg)",
    quantity: 1,
    paymentType: "CREDIT",
    saleDateIso: "2026-11-24T17:00:00.000Z",
  },

  // Farmer 105: Prakash Deshmukh (2 sales)
  {
    customerCode: 105,
    foodName: "Crushed Maize / Corn (50kg Bag)",
    quantity: 2,
    paymentType: "PARTIAL",
    partialRatio: 0.5,
    saleDateIso: "2026-11-22T10:15:00.000Z",
  },
  {
    customerCode: 105,
    foodName: "Cotton Seed Cake (50kg Bag)",
    quantity: 2,
    paymentType: "CREDIT",
    saleDateIso: "2026-11-25T12:00:00.000Z",
  },

  // Farmer 106: Vitthal Pawar (3 sales)
  {
    customerCode: 106,
    foodName: "Cattle Feed Pellets (50kg Bag)",
    quantity: 2,
    paymentType: "CREDIT",
    saleDateIso: "2026-11-19T08:30:00.000Z",
  },
  {
    customerCode: 106,
    foodName: "Crushed Maize / Corn (50kg Bag)",
    quantity: 3,
    paymentType: "PAID",
    saleDateIso: "2026-11-23T11:00:00.000Z",
  },
  {
    customerCode: 106,
    foodName: "Chelated Mineral Mixture (5kg Pack)",
    quantity: 2,
    paymentType: "PARTIAL",
    partialRatio: 0.5,
    saleDateIso: "2026-11-25T14:45:00.000Z",
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

  // Load seeded farmers (101..106)
  const farmers = await prisma.customer.findMany({
    where: {
      adminId: admin.id,
      code: { in: [101, 102, 103, 104, 105, 106] },
    },
    orderBy: { code: "asc" },
  });

  if (farmers.length === 0) {
    throw new Error("Seeded farmers (codes 101..106) not found. Run seedTestDairy.ts first.");
  }

  const farmerByCode = new Map(farmers.map((f) => [f.code, f]));

  // Load available food purchases (FIFO by purchaseDate)
  const purchases = await prisma.foodPurchase.findMany({
    where: { adminId: admin.id, isActive: true },
    orderBy: { purchaseDate: "asc" },
  });

  if (purchases.length === 0) {
    throw new Error("No food purchases found. Run seedFeedInventory.ts first.");
  }

  let salesCreated = 0;
  let salesSkipped = 0;

  for (const spec of SEED_SALES) {
    const farmer = farmerByCode.get(spec.customerCode);
    if (!farmer) {
      throw new Error(`Farmer with code ${spec.customerCode} not found.`);
    }

    const saleDate = new Date(spec.saleDateIso);

    // Idempotency check: skip if this exact sale already exists
    const existingSale = await prisma.foodSale.findFirst({
      where: {
        adminId: admin.id,
        customerId: farmer.id,
        foodName: spec.foodName,
        saleDate,
      },
      select: { id: true },
    });

    if (existingSale) {
      salesSkipped++;
      continue;
    }

    // Find an eligible purchase batch for this product with sufficient remaining stock
    const batch = await prisma.foodPurchase.findFirst({
      where: {
        adminId: admin.id,
        foodName: spec.foodName,
        remainingQuantity: { gte: spec.quantity },
      },
      orderBy: { purchaseDate: "asc" },
    });

    if (!batch) {
      throw new Error(`Insufficient stock for "${spec.foodName}" (requested ${spec.quantity}).`);
    }

    const totalAmount = spec.quantity * batch.sellRate;
    let amountPaid = 0;
    let isCashPayment = false;

    if (spec.paymentType === "PAID") {
      amountPaid = totalAmount;
      isCashPayment = true;
    } else if (spec.paymentType === "PARTIAL") {
      amountPaid = Math.round(totalAmount * (spec.partialRatio ?? 0.5));
      isCashPayment = true;
    } else {
      amountPaid = 0;
      isCashPayment = false;
    }

    await createFoodSale(admin.id, {
      customerId: farmer.id,
      foodPurchaseId: batch.id,
      quantity: spec.quantity,
      amountPaid,
      isCashPayment,
      saleDate: spec.saleDateIso,
    });

    salesCreated++;
  }

  console.log(`\n🛒 Feed Sales: ${salesCreated} created, ${salesSkipped} already existed.`);

  // Verify updated inventory stock
  const updatedPurchases = await prisma.foodPurchase.findMany({
    where: { adminId: admin.id },
    orderBy: { purchaseDate: "asc" },
  });

  const stockSummary = new Map<string, { purchased: number; remaining: number }>();
  for (const p of updatedPurchases) {
    if (p.remainingQuantity < 0) {
      throw new Error(`Negative stock detected on purchase ${p.id} (${p.foodName}): ${p.remainingQuantity}`);
    }
    const curr = stockSummary.get(p.foodName) || { purchased: 0, remaining: 0 };
    curr.purchased += p.quantity;
    curr.remaining += p.remainingQuantity;
    stockSummary.set(p.foodName, curr);
  }

  console.log("\n📦 Verified Remaining Inventory:");
  for (const [name, s] of stockSummary.entries()) {
    console.log(`   - ${name}: Purchased=${s.purchased}, Sold=${s.purchased - s.remaining}, Remaining=${s.remaining}`);
  }

  // Verify farmer-wise feed sale totals
  const allSales = await prisma.foodSale.findMany({
    where: {
      adminId: admin.id,
      customerId: { in: farmers.map((f) => f.id) },
    },
    include: { customer: { select: { code: true, name: true } } },
  });

  const byFarmer = new Map<
    number,
    { name: string; count: number; qty: number; total: number; paid: number; pending: number }
  >();

  let grandTotal = 0;
  let grandPaid = 0;
  let grandPending = 0;

  for (const sale of allSales) {
    grandTotal += sale.totalAmount;
    grandPaid += sale.amountPaid;
    grandPending += sale.pendingAmount;

    const curr = byFarmer.get(sale.customer.code) || {
      name: sale.customer.name,
      count: 0,
      qty: 0,
      total: 0,
      paid: 0,
      pending: 0,
    };
    curr.count += 1;
    curr.qty += sale.quantity;
    curr.total += sale.totalAmount;
    curr.paid += sale.amountPaid;
    curr.pending += sale.pendingAmount;
    byFarmer.set(sale.customer.code, curr);
  }

  console.log("\n👨‍🌾 Farmer-wise Feed Sale Totals:");
  for (const [code, f] of Array.from(byFarmer.entries()).sort((a, b) => a[0] - b[0])) {
    console.log(
      `   - [${code}] ${f.name}: Sales=${f.count}, Qty=${f.qty}, Total=₹${f.total.toFixed(2)}, Paid=₹${f.paid.toFixed(2)}, Outstanding=₹${f.pending.toFixed(2)}`
    );
  }

  console.log("\n💰 Overall Feed Sales Summary:");
  console.log(`   Total Transactions: ${allSales.length}`);
  console.log(`   Grand Total Sales: ₹${grandTotal.toFixed(2)}`);
  console.log(`   Total Paid: ₹${grandPaid.toFixed(2)}`);
  console.log(`   Total Outstanding: ₹${grandPending.toFixed(2)}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("❌ Feed sales seed failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });

