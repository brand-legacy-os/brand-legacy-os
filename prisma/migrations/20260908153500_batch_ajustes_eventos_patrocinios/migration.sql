-- AlterTable
ALTER TABLE "Sponsor" ADD COLUMN "presentationFileUrl" TEXT;
ALTER TABLE "Sponsor" ADD COLUMN "videoFileUrl" TEXT;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "mediaScopePlanned" TEXT;
ALTER TABLE "Event" ADD COLUMN "mediaScopeActual" TEXT;

-- AlterTable
ALTER TABLE "EventAttendee" ADD COLUMN "instagramPersonal" TEXT;
ALTER TABLE "EventAttendee" ADD COLUMN "focalPerson" TEXT;
ALTER TABLE "EventAttendee" ADD COLUMN "inWhatsappGroup" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "EventAttendeeSale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attendeeId" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "paymentPlan" TEXT NOT NULL,
    "installmentCount" INTEGER,
    "paymentMethod" TEXT NOT NULL,
    "saleDate" DATETIME NOT NULL,
    "sellerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventAttendeeSale_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "EventAttendee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventAttendeeSale_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "EventAttendeeSale_attendeeId_idx" ON "EventAttendeeSale"("attendeeId");
