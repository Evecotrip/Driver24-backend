/*
  Warnings:

  - You are about to drop the column `rcImage` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `rcNumber` on the `drivers` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "drivers_rcNumber_key";

-- AlterTable
ALTER TABLE "drivers" DROP COLUMN "rcImage",
DROP COLUMN "rcNumber";
