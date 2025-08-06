-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('GUEST', 'CUSTOMER', 'VENDOR_PENDING', 'VENDOR');

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('PENDING', 'APPROVED', 'LIVE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'GUEST',
    "status" "public"."Status" NOT NULL DEFAULT 'PENDING',
    "firstName" TEXT,
    "lastName" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "pinCode" TEXT,
    "city" TEXT,
    "state" TEXT,
    "address" TEXT,
    "storeName" TEXT,
    "storeAddress" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "profilePhoto" TEXT,
    "coverPhoto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "public"."User"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");
