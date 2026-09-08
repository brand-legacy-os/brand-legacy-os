-- AlterTable
ALTER TABLE "EventAttendee" ADD COLUMN "inDinner" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "EventAttendeeSale" ADD COLUMN "paymentMethodOther" TEXT;
ALTER TABLE "EventAttendeeSale" ADD COLUMN "notes" TEXT;

-- AlterTable
ALTER TABLE "EventDinnerGuest" ADD COLUMN "attendeeId" TEXT;

-- CreateTable
CREATE TABLE "EventAttendeeSaleInstallment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "dueDate" DATETIME NOT NULL,
    CONSTRAINT "EventAttendeeSaleInstallment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "EventAttendeeSale" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "EventAttendeeSaleInstallment_saleId_idx" ON "EventAttendeeSaleInstallment"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "EventDinnerGuest_attendeeId_key" ON "EventDinnerGuest"("attendeeId");
