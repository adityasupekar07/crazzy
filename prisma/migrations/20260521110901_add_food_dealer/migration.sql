-- =====================================================
-- ENUMS
-- =====================================================

-- Existing Enum
CREATE TYPE "PaymentMode" AS ENUM (
    'CASH',
    'ONLINE',
    'UPI',
    'BANK_TRANSFER',
    'CREDIT'
);

-- Existing Enum
CREATE TYPE "RateChartType" AS ENUM (
    'FIXED',
    'FAT',
    'FAT_SNF',
    'FAT_SNF_STEP',
    'FAT_SNF_PER_KG',
    'MATRIX'
);

-- =====================================================
-- MISSING ENUMS (IMPORTANT FIX)
-- =====================================================

CREATE TYPE "MilkType" AS ENUM (
    'COW',
    'BUFFALO',
    'MIX'
);

CREATE TYPE "CollectionShift" AS ENUM (
    'MORNING',
    'EVENING',
    'BOTH'
);

-- =====================================================
-- FOOD ENTRY
-- =====================================================

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

    CONSTRAINT "FoodEntry_pkey"
    PRIMARY KEY ("id")
);

-- =====================================================
-- RATE CHART
-- =====================================================

CREATE TABLE "RateChart" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RateChartType" NOT NULL,
    "milkType" "MilkType" NOT NULL,
    "shift" "CollectionShift" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateChart_pkey"
    PRIMARY KEY ("id")
);

-- =====================================================
-- RATE RULE
-- =====================================================

CREATE TABLE "RateRule" (
    "id" TEXT NOT NULL,
    "rateChartId" TEXT NOT NULL,
    "fixedRate" DOUBLE PRECISION,
    "baseFat" DOUBLE PRECISION,
    "baseSnf" DOUBLE PRECISION,
    "baseRate" DOUBLE PRECISION,
    "fatStep" DOUBLE PRECISION,
    "fatRateIncrement" DOUBLE PRECISION,
    "snfStep" DOUBLE PRECISION,
    "snfRateIncrement" DOUBLE PRECISION,
    "fatRatePerKg" DOUBLE PRECISION,
    "snfRatePerKg" DOUBLE PRECISION,
    "minFat" DOUBLE PRECISION,
    "maxFat" DOUBLE PRECISION,
    "minSnf" DOUBLE PRECISION,
    "maxSnf" DOUBLE PRECISION,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateRule_pkey"
    PRIMARY KEY ("id")
);

-- =====================================================
-- RATE MATRIX
-- =====================================================

CREATE TABLE "RateMatrix" (
    "id" TEXT NOT NULL,
    "rateChartId" TEXT NOT NULL,
    "fat" DOUBLE PRECISION,
    "snf" DOUBLE PRECISION,
    "rate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateMatrix_pkey"
    PRIMARY KEY ("id")
);

-- =====================================================
-- FOOD DEALER
-- =====================================================

CREATE TABLE "FoodDealer" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodDealer_pkey"
    PRIMARY KEY ("id")
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX "FoodEntry_customerId_idx"
ON "FoodEntry"("customerId");

CREATE INDEX "FoodEntry_date_idx"
ON "FoodEntry"("date");

CREATE INDEX "FoodEntry_customerId_date_idx"
ON "FoodEntry"("customerId", "date");

CREATE INDEX "RateChart_adminId_idx"
ON "RateChart"("adminId");

CREATE INDEX "RateChart_milkType_idx"
ON "RateChart"("milkType");

CREATE INDEX "RateChart_shift_idx"
ON "RateChart"("shift");

CREATE UNIQUE INDEX "RateRule_rateChartId_key"
ON "RateRule"("rateChartId");

CREATE INDEX "RateMatrix_rateChartId_idx"
ON "RateMatrix"("rateChartId");

CREATE INDEX "RateMatrix_fat_snf_idx"
ON "RateMatrix"("fat", "snf");

CREATE UNIQUE INDEX "RateMatrix_rateChartId_fat_snf_key"
ON "RateMatrix"(
    "rateChartId",
    "fat",
    "snf"
);

CREATE INDEX "FoodDealer_adminId_idx"
ON "FoodDealer"("adminId");

CREATE INDEX "FoodDealer_name_idx"
ON "FoodDealer"("name");

CREATE INDEX "FoodDealer_phone_idx"
ON "FoodDealer"("phone");

CREATE UNIQUE INDEX "FoodDealer_adminId_code_key"
ON "FoodDealer"(
    "adminId",
    "code"
);

-- =====================================================
-- FOREIGN KEYS
-- =====================================================

ALTER TABLE "FoodEntry"
ADD CONSTRAINT "FoodEntry_customerId_fkey"
FOREIGN KEY ("customerId")
REFERENCES "Customer"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "RateChart"
ADD CONSTRAINT "RateChart_adminId_fkey"
FOREIGN KEY ("adminId")
REFERENCES "Admin"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "RateRule"
ADD CONSTRAINT "RateRule_rateChartId_fkey"
FOREIGN KEY ("rateChartId")
REFERENCES "RateChart"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "RateMatrix"
ADD CONSTRAINT "RateMatrix_rateChartId_fkey"
FOREIGN KEY ("rateChartId")
REFERENCES "RateChart"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "FoodDealer"
ADD CONSTRAINT "FoodDealer_adminId_fkey"
FOREIGN KEY ("adminId")
REFERENCES "Admin"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;