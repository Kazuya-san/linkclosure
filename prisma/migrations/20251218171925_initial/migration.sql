-- CreateEnum
CREATE TYPE "public"."Plan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "public"."LinkStatus" AS ENUM ('HEALTHY', 'DELAYED', 'AT_RISK', 'CLOSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."GoalType" AS ENUM ('OPEN');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('CREATED', 'OPENED', 'REMINDER_SENT', 'EXPIRED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "plan" "public"."Plan" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Link" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "goalType" "public"."GoalType" NOT NULL DEFAULT 'OPEN',
    "status" "public"."LinkStatus" NOT NULL DEFAULT 'HEALTHY',
    "recipientEmail" VARCHAR(320),
    "notifyOnOpen" BOOLEAN NOT NULL DEFAULT true,
    "remindAfterHours" INTEGER NOT NULL DEFAULT 48,
    "maxReminders" INTEGER NOT NULL DEFAULT 2,
    "remindersSent" INTEGER NOT NULL DEFAULT 0,
    "firstOpenedAt" TIMESTAMP(3),
    "lastOpenedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "type" "public"."EventType" NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Link_slug_key" ON "public"."Link"("slug");

-- CreateIndex
CREATE INDEX "Link_userId_createdAt_idx" ON "public"."Link"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Link_status_expiresAt_idx" ON "public"."Link"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Link_slug_idx" ON "public"."Link"("slug");

-- CreateIndex
CREATE INDEX "Event_linkId_createdAt_idx" ON "public"."Event"("linkId", "createdAt");

-- CreateIndex
CREATE INDEX "Event_type_createdAt_idx" ON "public"."Event"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Link" ADD CONSTRAINT "Link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "public"."Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;
