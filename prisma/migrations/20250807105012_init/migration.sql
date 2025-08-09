-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('GUEST', 'USER', 'CUSTOMER', 'VENDOR_PENDING', 'VENDOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('PENDING', 'APPROVED', 'LIVE');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT,
    "email" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "avatar" TEXT,
    "profilePhoto" TEXT,
    "coverPhoto" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'PENDING',
    "pinCode" TEXT,
    "city" TEXT,
    "state" TEXT,
    "address" TEXT,
    "storeName" TEXT,
    "storeAddress" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_deviceId_key" ON "public"."users"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_key" ON "public"."users"("mobile");
