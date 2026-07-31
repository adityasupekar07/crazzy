-- CreateEnum
CREATE TYPE "CollectionType" AS ENUM ('FIXED_RATE', 'FAT_BASED', 'FAT_SNF_BASED');

-- CreateEnum
CREATE TYPE "MilkType" AS ENUM ('COW', 'BUFFALO', 'MIX');

-- CreateEnum
CREATE TYPE "CollectionShift" AS ENUM ('MORNING', 'EVENING', 'BOTH');

-- CreateEnum
CREATE TYPE "PaymentPeriod" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'ONLINE', 'UPI', 'BANK_TRANSFER', 'CREDIT');

-- CreateEnum
CREATE TYPE "RateCategory" AS ENUM ('COLLECTION', 'SALE');

-- CreateEnum
CREATE TYPE "ChartType" AS ENUM ('POINT', 'EXCEL');

-- CreateEnum
CREATE TYPE "RateMethod" AS ENUM ('FAT_SNF', 'FAT_ONLY', 'FIXED');

-- CreateEnum
CREATE TYPE "RuleAxis" AS ENUM ('FAT', 'SNF');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "dairyName" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "taluka" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "collectionType" "CollectionType" NOT NULL,
    "milkType" "MilkType" NOT NULL,
    "collectionShift" "CollectionShift" NOT NULL,
    "paymentPeriod" "PaymentPeriod" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "address" TEXT,
    "milkType" "MilkType" NOT NULL,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilkEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "shift" "CollectionShift" NOT NULL,
    "milkType" "MilkType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION,
    "snf" DOUBLE PRECISION,
    "rate" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MilkEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "receiptNo" TEXT,
    "paymentMode" "PaymentMode" NOT NULL,
    "notes" TEXT,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateChart" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "milkType" "MilkType" NOT NULL,
    "category" "RateCategory" NOT NULL,
    "chartType" "ChartType" NOT NULL,
    "method" "RateMethod" NOT NULL,
    "baseRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adminId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateChart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FatStep" (
    "id" TEXT NOT NULL,
    "startValue" DOUBLE PRECISION NOT NULL,
    "increment" DOUBLE PRECISION NOT NULL,
    "rateChartId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FatStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnfStep" (
    "id" TEXT NOT NULL,
    "startValue" DOUBLE PRECISION NOT NULL,
    "increment" DOUBLE PRECISION NOT NULL,
    "rateChartId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SnfStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonusPenaltyRule" (
    "id" TEXT NOT NULL,
    "axis" "RuleAxis" NOT NULL,
    "fromValue" DOUBLE PRECISION NOT NULL,
    "toValue" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "rateChartId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BonusPenaltyRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_mobile_key" ON "Admin"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_adminId_code_key" ON "Customer"("adminId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_adminId_mobile_key" ON "Customer"("adminId", "mobile");

-- CreateIndex
CREATE INDEX "MilkEntry_customerId_idx" ON "MilkEntry"("customerId");

-- CreateIndex
CREATE INDEX "MilkEntry_date_idx" ON "MilkEntry"("date");

-- CreateIndex
CREATE INDEX "MilkEntry_customerId_date_idx" ON "MilkEntry"("customerId", "date");

-- CreateIndex
CREATE INDEX "FoodEntry_customerId_idx" ON "FoodEntry"("customerId");

-- CreateIndex
CREATE INDEX "FoodEntry_date_idx" ON "FoodEntry"("date");

-- CreateIndex
CREATE INDEX "FoodEntry_customerId_date_idx" ON "FoodEntry"("customerId", "date");

-- CreateIndex
CREATE INDEX "RateChart_adminId_idx" ON "RateChart"("adminId");

-- CreateIndex
CREATE INDEX "FatStep_rateChartId_idx" ON "FatStep"("rateChartId");

-- CreateIndex
CREATE INDEX "SnfStep_rateChartId_idx" ON "SnfStep"("rateChartId");

-- CreateIndex
CREATE INDEX "BonusPenaltyRule_rateChartId_idx" ON "BonusPenaltyRule"("rateChartId");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilkEntry" ADD CONSTRAINT "MilkEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodEntry" ADD CONSTRAINT "FoodEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateChart" ADD CONSTRAINT "RateChart_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FatStep" ADD CONSTRAINT "FatStep_rateChartId_fkey" FOREIGN KEY ("rateChartId") REFERENCES "RateChart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnfStep" ADD CONSTRAINT "SnfStep_rateChartId_fkey" FOREIGN KEY ("rateChartId") REFERENCES "RateChart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusPenaltyRule" ADD CONSTRAINT "BonusPenaltyRule_rateChartId_fkey" FOREIGN KEY ("rateChartId") REFERENCES "RateChart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
