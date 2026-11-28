-- ============================================================================
-- Phase 9: Settlement Finalization Support Migration
--
-- 1. Creates billing_preview_records for server-side preview & fingerprint validation
-- 2. Creates billing_idempotency_keys with unique (adminId, idempotencyKey)
-- 3. Creates settlement_audit_logs for transaction-scoped settlement auditing
-- 4. Creates settlement_ledger_entries for non-duplicated settlement ledgering
-- 5. Adds PostgreSQL GiST exclusion constraint preventing overlapping FINALIZED
--    settlements for the same (adminId, customerId)
-- ============================================================================

-- Step 1: Enable btree_gist for exclusion constraint on (adminId, customerId, tsrange)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Step 2: Prevent overlapping FINALIZED settlements at the database level
ALTER TABLE "bill_settlements"
  DROP CONSTRAINT IF EXISTS "bill_settlements_no_overlapping_finalized_period";

ALTER TABLE "bill_settlements"
  ADD CONSTRAINT "bill_settlements_no_overlapping_finalized_period"
  EXCLUDE USING gist (
    "adminId" WITH =,
    "customerId" WITH =,
    tsrange("cycleStartDate", "cycleEndDate", '[]') WITH &&
  )
  WHERE ("status" = 'FINALIZED');

-- Step 3: Create billing_preview_records table
CREATE TABLE IF NOT EXISTS "billing_preview_records" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "startDate" TEXT NOT NULL,
  "endDate" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "billing_preview_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "billing_preview_records_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "billing_preview_records_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "billing_preview_records_adminId_customerId_idx" ON "billing_preview_records"("adminId", "customerId");

-- Step 4: Create billing_idempotency_keys table
CREATE TABLE IF NOT EXISTS "billing_idempotency_keys" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "settlementId" TEXT,
  "responseSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "billing_idempotency_keys_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "billing_idempotency_keys_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "billing_idempotency_keys_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "bill_settlements"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "billing_idempotency_keys_adminId_idempotencyKey_key" ON "billing_idempotency_keys"("adminId", "idempotencyKey");
CREATE INDEX IF NOT EXISTS "billing_idempotency_keys_settlementId_idx" ON "billing_idempotency_keys"("settlementId");

-- Step 5: Create settlement_audit_logs table
CREATE TABLE IF NOT EXISTS "settlement_audit_logs" (
  "id" TEXT NOT NULL,
  "settlementId" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "performedBy" TEXT,
  "cycleStartDate" TIMESTAMP(3) NOT NULL,
  "cycleEndDate" TIMESTAMP(3) NOT NULL,
  "grossMilkAmount" DECIMAL(14, 2) NOT NULL,
  "feedDeducted" DECIMAL(14, 2) NOT NULL,
  "advanceDeducted" DECIMAL(14, 2) NOT NULL,
  "netPayable" DECIMAL(14, 2) NOT NULL,
  "action" TEXT NOT NULL DEFAULT 'FINALIZED',
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "settlement_audit_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "settlement_audit_logs_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "bill_settlements"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "settlement_audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "settlement_audit_logs_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "settlement_audit_logs_settlementId_idx" ON "settlement_audit_logs"("settlementId");
CREATE INDEX IF NOT EXISTS "settlement_audit_logs_adminId_customerId_idx" ON "settlement_audit_logs"("adminId", "customerId");

-- Step 6: Create settlement_ledger_entries table
CREATE TABLE IF NOT EXISTS "settlement_ledger_entries" (
  "id" TEXT NOT NULL,
  "settlementId" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "grossMilkAmount" DECIMAL(14, 2) NOT NULL,
  "totalDeductions" DECIMAL(14, 2) NOT NULL,
  "netPayableAmount" DECIMAL(14, 2) NOT NULL,
  "remainingFeedBalance" DECIMAL(14, 2) NOT NULL,
  "remainingAdvanceBalance" DECIMAL(14, 2) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "settlement_ledger_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "settlement_ledger_entries_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "bill_settlements"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "settlement_ledger_entries_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "settlement_ledger_entries_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "settlement_ledger_entries_settlementId_key" ON "settlement_ledger_entries"("settlementId");
CREATE INDEX IF NOT EXISTS "settlement_ledger_entries_adminId_customerId_idx" ON "settlement_ledger_entries"("adminId", "customerId");

