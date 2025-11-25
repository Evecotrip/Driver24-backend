-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'DRIVER', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "username" TEXT,
    "profileImageUrl" TEXT,
    "role" "UserRole",
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "rcNumber" TEXT NOT NULL,
    "rcImage" TEXT,
    "dlNumber" TEXT NOT NULL,
    "dlImage" TEXT,
    "permanentAddress" TEXT NOT NULL,
    "operatingAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "pincode" TEXT,
    "vehicleType" TEXT,
    "vehicleModel" TEXT,
    "vehicleNumber" TEXT,
    "experience" INTEGER,
    "availability" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_clerkId_idx" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_userId_key" ON "drivers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_rcNumber_key" ON "drivers"("rcNumber");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_dlNumber_key" ON "drivers"("dlNumber");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_vehicleNumber_key" ON "drivers"("vehicleNumber");

-- CreateIndex
CREATE INDEX "drivers_city_idx" ON "drivers"("city");

-- CreateIndex
CREATE INDEX "drivers_userId_idx" ON "drivers"("userId");

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
