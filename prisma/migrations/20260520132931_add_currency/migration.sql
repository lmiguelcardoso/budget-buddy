/*
  Warnings:

  - You are about to drop the column `net_worth` on the `net_worth_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `total_assets` on the `net_worth_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `total_liabilities` on the `net_worth_snapshots` table. All the data in the column will be lost.
  - Added the required column `net_worth_brl` to the `net_worth_snapshots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `net_worth_usd` to the `net_worth_snapshots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_assets_brl` to the `net_worth_snapshots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_assets_usd` to the `net_worth_snapshots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_liabilities_brl` to the `net_worth_snapshots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_liabilities_usd` to the `net_worth_snapshots` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'BRL');

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "liabilities" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "net_worth_snapshots" DROP COLUMN "net_worth",
DROP COLUMN "total_assets",
DROP COLUMN "total_liabilities",
ADD COLUMN     "net_worth_brl" DECIMAL(18,2) NOT NULL,
ADD COLUMN     "net_worth_usd" DECIMAL(18,2) NOT NULL,
ADD COLUMN     "total_assets_brl" DECIMAL(18,2) NOT NULL,
ADD COLUMN     "total_assets_usd" DECIMAL(18,2) NOT NULL,
ADD COLUMN     "total_liabilities_brl" DECIMAL(18,2) NOT NULL,
ADD COLUMN     "total_liabilities_usd" DECIMAL(18,2) NOT NULL;
