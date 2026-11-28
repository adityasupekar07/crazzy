-- ============================================================================
-- Phase 2: Billing Settlement Database Design Migration
--
-- Description:
-- 1. Creates BillSettlementStatus enum and extends AdvanceTransactionType
-- 2. Adds isSettled flag to MilkEntry
-- 3. Creates bill_settlements, settlement_milk_entries,
--    settlement_feed_allocations, and settlement_advance_allocations tables
-- 4. Links advance_transactions to bill_settlements via settlementId
-- ============================================================================

-- Step 1: Create BillSettlementStatus enum
DO $$ BEGIN
  CREATE TYPE "BillSettlementStatus" AS ENUM ('FINALIZED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Extend AdvanceTransactionType enum
ALTER TYPE "AdvanceTransactionType" ADD VALUE IF NOT EXISTS 'BILL_SETTLEMENT_RECOVERY';

-- Step 3: Add isSettled flag to MilkEntry
ALTER TABLE "MilkEntry"
  ADD COLUMN IF NOT EXISTS "isSettled" BOOLEAN NOT NULL DEFAULT false;

-- Step 4: Create bill_settlements table
CREATE TABLE IF NOT EXISTS "bill_settlements" (
  "id" TEXT NOT NULL,
  "settlementNumber" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "paymentPeriod" "PaymentPeriod",
  "cycleStartDate" TIMESTAMP(3) NOT NULL,
  "cycleEndDate" TIMESTAMP(3) NOT NULL,
  "totalLitres" DECIMAL(12, 2) NOT NULL,
  "avgFat" DECIMAL(5, 2) NOT NULL,
  "avgSnf" DECIMAL(5, 2) NOT NULL,
  "grossMilkAmount" DECIMAL(14, 2) NOT NULL,
  "previousFeedPending" DECIMAL(14, 2) NOT NULL,
  "feedDeductionAmount" DECIMAL(14, 2) NOT NULL,
  "remainingFeedBalance" DECIMAL(14, 2) NOT NULL,
  "previousAdvancePending" DECIMAL(14, 2) NOT NULL,
  "advanceDeductionAmount" DECIMAL(14, 2) NOT NULL,
  "remainingAdvanceBalance" DECIMAL(14, 2) NOT NULL,
  "netPayableAmount" DECIMAL(14, 2) NOT NULL,
  "paymentMode" "PaymentMode" NOT NULL DEFAULT 'CASH',
  "status" "BillSettlementStatus" NOT NULL DEFAULT 'FINALIZED',
  "remarks" TEXT,
  "settledBy" TEXT,
  "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "bill_settlements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bill_settlements_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bill_settlements_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "bill_settlements_settlementNumber_key" ON "bill_settlements"("settlementNumber");
CREATE INDEX IF NOT EXISTS "bill_settlements_adminId_idx" ON "bill_settlements"("adminId");
CREATE INDEX IF NOT EXISTS "bill_settlements_customerId_idx" ON "bill_settlements"("customerId");
CREATE INDEX IF NOT EXISTS "bill_settlements_adminId_customerId_cycleStartDate_cycleEndDate_idx" ON "bill_settlements"("adminId", "customerId", "cycleStartDate", "cycleEndDate");
CREATE INDEX IF NOT EXISTS "bill_settlements_adminId_settledAt_idx" ON "bill_settlements"("adminId", "settledAt");

-- Step 5: Link advance_transactions to bill_settlements
ALTER TABLE "advance_transactions"
  ADD COLUMN IF NOT EXISTS "settlementId" TEXT;

CREATE INDEX IF NOT EXISTS "advance_transactions_settlementId_idx" ON "advance_transactions"("settlementId");

ALTER TABLE "advance_transactions" DROP CONSTRAINT IF EXISTS "advance_transactions_settlementId_fkey";
ALTER TABLE "advance_transactions"
  ADD CONSTRAINT "advance_transactions_settlementId_fkey"
  FOREIGN KEY ("settlementId") REFERENCES "bill_settlements"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 6: Create settlement_milk_entries table
CREATE TABLE IF NOT EXISTS "settlement_milk_entries" (
  "id" TEXT NOT NULL,
  "settlementId" TEXT NOT NULL,
  "milkEntryId" TEXT NOT NULL,
  "collectionDate" TIMESTAMP(3) NOT NULL,
  "shift" "CollectionShift" NOT NULL,
  "milkType" "MilkType" NOT NULL,
  "quantity" DECIMAL(10, 2) NOT NULL,
  "fat" DECIMAL(5, 2),
  "snf" DECIMAL(5, 2),
  "rate" DECIMAL(12, 4) NOT NULL,
  "totalAmount" DECIMAL(14, 2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "settlement_milk_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "settlement_milk_entries_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "bill_settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "settlement_milk_entries_milkEntryId_fkey" FOREIGN KEY ("milkEntryId") REFERENCES "MilkEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "settlement_milk_entries_milkEntryId_key" ON "settlement_milk_entries"("milkEntryId");
CREATE INDEX IF NOT EXISTS "settlement_milk_entries_settlementId_idx" ON "settlement_milk_entries"("settlementId");

-- Step 7: Create settlement_feed_allocations table
CREATE TABLE IF NOT EXISTS "settlement_feed_allocations" (
  "id" TEXT NOT NULL,
  "settlementId" TEXT NOT NULL,
  "foodSaleId" TEXT NOT NULL,
  "originalSaleAmount" DECIMAL(14, 2) NOT NULL,
  "previousPendingAmount" DECIMAL(14, 2) NOT NULL,
  "allocatedAmount" DECIMAL(14, 2) NOT NULL,
  "remainingPendingAmount" DECIMAL(14, 2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "settlement_feed_allocations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "settlement_feed_allocations_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "bill_settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "settlement_feed_allocations_foodSaleId_fkey" FOREIGN KEY ("foodSaleId") REFERENCES "FoodSale"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "settlement_feed_allocations_settlementId_foodSaleId_key" ON "settlement_feed_allocations"("settlementId", "foodSaleId");
CREATE INDEX IF NOT EXISTS "settlement_feed_allocations_settlementId_idx" ON "settlement_feed_allocations"("settlementId");
CREATE INDEX IF NOT EXISTS "settlement_feed_allocations_foodSaleId_idx" ON "settlement_feed_allocations"("foodSaleId");

-- Step 8: Create settlement_advance_allocations table
CREATE TABLE IF NOT EXISTS "settlement_advance_allocations" (
  "id" TEXT NOT NULL,
  "settlementId" TEXT NOT NULL,
  "advanceId" TEXT NOT NULL,
  "originalAdvanceAmount" DECIMAL(14, 2) NOT NULL,
  "previousPendingAmount" DECIMAL(14, 2) NOT NULL,
  "allocatedAmount" DECIMAL(14, 2) NOT NULL,
  "remainingPendingAmount" DECIMAL(14, 2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "settlement_advance_allocations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "settlement_advance_allocations_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "bill_settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "settlement_advance_allocations_advanceId_fkey" FOREIGN KEY ("advanceId") REFERENCES "advances"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "settlement_advance_allocations_settlementId_advanceId_key" ON "settlement_advance_allocations"("settlementId", "advanceId");
CREATE INDEX IF NOT EXISTS "settlement_advance_allocations_settlementId_idx" ON "settlement_advance_allocations"("settlementId");
CREATE INDEX IF NOT EXISTS "settlement_advance_allocations_advanceId_idx" ON "settlement_advance_allocations"("advanceId");

