/*
  Warnings:

  - A unique constraint covering the columns `[panNumber]` on the table `drivers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[aadharNumber]` on the table `drivers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "drivers" ADD COLUMN     "aadharImage" TEXT,
ADD COLUMN     "aadharNumber" TEXT,
ADD COLUMN     "panImage" TEXT,
ADD COLUMN     "panNumber" TEXT;

-- CreateTable
CREATE TABLE "pending_drivers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dlNumber" TEXT NOT NULL,
    "dlImage" TEXT,
    "panNumber" TEXT NOT NULL,
    "panImage" TEXT,
    "aadharNumber" TEXT NOT NULL,
    "aadharImage" TEXT,
    "permanentAddress" TEXT NOT NULL,
    "operatingAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "pincode" TEXT,
    "vehicleType" TEXT,
    "vehicleModel" TEXT,
    "vehicleNumber" TEXT,
    "experience" INTEGER,
    "salaryExpectation" INTEGER,
    "isConverted" BOOLEAN NOT NULL DEFAULT false,
    "convertedAt" TIMESTAMP(3),
    "convertedToUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_drivers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_drivers_email_key" ON "pending_drivers"("email");

-- CreateIndex
CREATE INDEX "pending_drivers_email_idx" ON "pending_drivers"("email");

-- CreateIndex
CREATE INDEX "pending_drivers_phoneNumber_idx" ON "pending_drivers"("phoneNumber");

-- CreateIndex
CREATE INDEX "pending_drivers_isConverted_idx" ON "pending_drivers"("isConverted");

-- CreateIndex
CREATE INDEX "pending_drivers_expiresAt_idx" ON "pending_drivers"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_panNumber_key" ON "drivers"("panNumber");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_aadharNumber_key" ON "drivers"("aadharNumber");
