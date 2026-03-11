-- CreateTable
CREATE TABLE "DailyEncouragement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "context" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "DailyEncouragement_date_idx" ON "DailyEncouragement"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyEncouragement_date_key" ON "DailyEncouragement"("date");
