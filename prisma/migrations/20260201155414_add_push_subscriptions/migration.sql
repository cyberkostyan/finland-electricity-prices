-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dhKey" TEXT NOT NULL,
    "authKey" TEXT NOT NULL,
    "lowPriceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "highPriceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastLowAlertAt" TIMESTAMP(3),
    "lastHighAlertAt" TIMESTAMP(3),
    "lastAlertPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
