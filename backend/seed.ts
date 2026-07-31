import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password", 10);
  
  // 1. Clean up existing admin if any
  await prisma.admin.deleteMany({
    where: { mobile: "9876543210" }
  });

  // 2. Create Admin
  const admin = await prisma.admin.create({
    data: {
      ownerName: "Aditya Supekar",
      mobile: "9876543210",
      password: hashedPassword,
      dairyName: "Gokul Dairy Coop",
      village: "Malegaon",
      taluka: "Sinnar",
      district: "Nashik",
      state: "Maharashtra",
      collectionType: "FAT_SNF_BASED",
      milkType: "MIX",
      collectionShift: "BOTH",
      paymentPeriod: "WEEKLY",
    }
  });

  console.log("Seeded Admin successfully:", admin.mobile);

  // 3. Create a Food Dealer
  const dealer = await prisma.foodDealer.create({
    data: {
      adminId: admin.id,
      code: "DLR-101",
      name: "Agrawal Agro Agencies",
      phone: "8877665544",
      address: "APMC Market Yard, Nashik",
      isActive: true,
    }
  });

  console.log("Seeded Food Dealer successfully:", dealer.name);

  // 4. Create a Food Purchase (Bulk stock of feed)
  const purchase = await prisma.foodPurchase.create({
    data: {
      adminId: admin.id,
      dealerId: dealer.id,
      foodName: "Kapila Super Feed (50kg)",
      quantity: 100.0,
      remainingQuantity: 100.0,
      buyRate: 1400.0,
      sellRate: 1600.0,
      totalAmount: 140000.0,
      amountPaid: 140000.0,
      pendingAmount: 0.0,
      purchaseDate: new Date(),
      isActive: true,
    }
  });

  console.log("Seeded Food Purchase stock successfully:", purchase.foodName);

  // 5. Create a couple of registered Farmers
  const farmer1 = await prisma.customer.create({
    data: {
      adminId: admin.id,
      code: 101,
      name: "Ramesh Patil",
      mobile: "9988776655",
      address: "Malegaon Village",
      milkType: "COW",
    }
  });

  const farmer2 = await prisma.customer.create({
    data: {
      adminId: admin.id,
      code: 102,
      name: "Suresh Deshmukh",
      mobile: "9876123450",
      address: "Sinnar Shivar",
      milkType: "BUFFALO",
    }
  });

  console.log("Seeded Farmers successfully:", farmer1.name, ",", farmer2.name);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
