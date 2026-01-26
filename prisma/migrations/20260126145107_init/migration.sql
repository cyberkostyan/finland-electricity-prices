-- CreateTable
CREATE TABLE "PredictionSnapshot" (
    "id" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetTime" TIMESTAMP(3) NOT NULL,
    "predictedPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PredictionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PredictionSnapshot_targetTime_idx" ON "PredictionSnapshot"("targetTime");

-- CreateIndex
CREATE UNIQUE INDEX "PredictionSnapshot_fetchedAt_targetTime_key" ON "PredictionSnapshot"("fetchedAt", "targetTime");
