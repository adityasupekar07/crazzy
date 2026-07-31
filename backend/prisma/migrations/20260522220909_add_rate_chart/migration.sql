-- AlterTable
ALTER TABLE "RateChart" ADD COLUMN     "effectiveFrom" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "RateChart_milkType_idx" ON "RateChart"("milkType");

-- CreateIndex
CREATE INDEX "RateChart_category_idx" ON "RateChart"("category");

-- CreateIndex
CREATE INDEX "RateChart_method_idx" ON "RateChart"("method");

-- CreateIndex
CREATE INDEX "RateChart_isActive_idx" ON "RateChart"("isActive");
