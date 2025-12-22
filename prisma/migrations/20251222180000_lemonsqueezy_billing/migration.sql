-- AlterTable
ALTER TABLE "public"."User"
ADD COLUMN     "lemonsqueezyCustomerId" VARCHAR(64),
ADD COLUMN     "lemonsqueezySubscriptionId" VARCHAR(64),
ADD COLUMN     "lemonsqueezySubscriptionStatus" VARCHAR(32),
ADD COLUMN     "lemonsqueezyRenewsAt" TIMESTAMP(3),
ADD COLUMN     "lemonsqueezyEndsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" VARCHAR(32) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_lemonsqueezySubscriptionId_key" ON "public"."User"("lemonsqueezySubscriptionId");

-- CreateIndex
CREATE INDEX "WebhookEvent_provider_receivedAt_idx" ON "public"."WebhookEvent"("provider", "receivedAt");

