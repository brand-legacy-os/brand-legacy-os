-- CreateTable
CREATE TABLE "Sponsorship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sponsorName" TEXT NOT NULL,
    "category" TEXT,
    "paymentMethod" TEXT,
    "contractTerm" TEXT,
    "competencia" TEXT,
    "dueDate" DATETIME,
    "plannedValue" REAL,
    "paidDate" DATETIME,
    "paidValue" REAL,
    "status" TEXT,
    "cashMonth" TEXT,
    "notes" TEXT,
    "eventId" TEXT,
    CONSTRAINT "Sponsorship_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Sponsorship_eventId_idx" ON "Sponsorship"("eventId");
