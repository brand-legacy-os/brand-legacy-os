-- CreateTable
CREATE TABLE "EventReferral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "referrerName" TEXT,
    "referrerEmpresa" TEXT,
    "referrerWhatsapp" TEXT,
    "referredName" TEXT NOT NULL,
    "referredEmpresa" TEXT,
    "referredInstagram" TEXT,
    "referredWhatsapp" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventReferral_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "EventReferral_eventId_idx" ON "EventReferral"("eventId");
