/*
  Warnings:

  - You are about to drop the `OTP` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "OTP";

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

-- CreateIndex
CREATE INDEX "MilkEntry_customerId_idx" ON "MilkEntry"("customerId");

-- CreateIndex
CREATE INDEX "MilkEntry_date_idx" ON "MilkEntry"("date");

-- CreateIndex
CREATE INDEX "MilkEntry_customerId_date_idx" ON "MilkEntry"("customerId", "date");

-- AddForeignKey
ALTER TABLE "MilkEntry" ADD CONSTRAINT "MilkEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
