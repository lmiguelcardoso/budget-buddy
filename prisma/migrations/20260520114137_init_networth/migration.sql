-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('STOCK', 'CRYPTO', 'TREASURY', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "LiabilityType" AS ENUM ('MORTGAGE', 'CREDIT_CARD', 'STUDENT_LOAN', 'OTHER');

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "AssetType" NOT NULL,
    "ticker" VARCHAR(20),
    "quantity" DECIMAL(18,8) NOT NULL,
    "manual_price" DECIMAL(18,8),
    "cached_price" DECIMAL(18,8),
    "price_fetched_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liabilities" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "LiabilityType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "net_worth_snapshots" (
    "id" UUID NOT NULL,
    "total_assets" DECIMAL(18,2) NOT NULL,
    "total_liabilities" DECIMAL(18,2) NOT NULL,
    "net_worth" DECIMAL(18,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "net_worth_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assets_type_idx" ON "assets"("type");

-- CreateIndex
CREATE INDEX "liabilities_type_idx" ON "liabilities"("type");

-- CreateIndex
CREATE INDEX "net_worth_snapshots_created_at_idx" ON "net_worth_snapshots"("created_at");
