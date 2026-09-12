-- EventAttendee: + segmento
ALTER TABLE "EventAttendee" ADD COLUMN "segmento" TEXT;

-- Event: remove escopo de midia em texto livre (substituido por EventMediaDeliverable)
ALTER TABLE "Event" DROP COLUMN "mediaScopePlanned";
ALTER TABLE "Event" DROP COLUMN "mediaScopeActual";

-- EventMediaTask: substituido por EventMediaDeliverable
DROP TABLE "EventMediaTask";

-- EventDay: unique por (eventId, date), pra upsert idempotente de dias do evento
CREATE UNIQUE INDEX "EventDay_eventId_date_key" ON "EventDay"("eventId", "date");

-- EventAgendaItem: reestruturado (zero uso real em src/, sem dado a preservar)
DROP TABLE "EventAgendaItem";
CREATE TABLE "EventAgendaItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventDayId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "who" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "objective" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "EventAgendaItem_eventDayId_fkey" FOREIGN KEY ("eventDayId") REFERENCES "EventDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventMediaDeliverable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT,
    "trackingOwnerId" TEXT,
    "executionOwnerId" TEXT,
    "executionOwnerOther" TEXT,
    "plannedDate" DATETIME,
    "isQuantityDelivery" BOOLEAN NOT NULL DEFAULT false,
    "plannedQuantity" INTEGER,
    "deliveredQuantity" INTEGER,
    "notes" TEXT,
    "fileLabel" TEXT,
    "fileUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventMediaDeliverable_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventMediaDeliverable_trackingOwnerId_fkey" FOREIGN KEY ("trackingOwnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EventMediaDeliverable_executionOwnerId_fkey" FOREIGN KEY ("executionOwnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "EventMediaDeliverable_eventId_idx" ON "EventMediaDeliverable"("eventId");

CREATE TABLE "EventMediaDeliverableRealization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deliverableId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    CONSTRAINT "EventMediaDeliverableRealization_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "EventMediaDeliverable" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "EventMediaDeliverableRealization_deliverableId_idx" ON "EventMediaDeliverableRealization"("deliverableId");

CREATE TABLE "EventAttendeeNegotiation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attendeeId" TEXT NOT NULL,
    "sellerId" TEXT,
    "negotiationDate" DATETIME NOT NULL,
    "value" REAL,
    "paymentConditions" TEXT,
    "leadInfo" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventAttendeeNegotiation_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "EventAttendee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventAttendeeNegotiation_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "EventAttendeeNegotiation_attendeeId_idx" ON "EventAttendeeNegotiation"("attendeeId");

CREATE TABLE "EventCommercialProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "minPaymentCondition" TEXT,
    "maxPaymentCondition" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "paymentMethodOther" TEXT,
    "scope" TEXT,
    "deckUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventCommercialProduct_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "EventCommercialProduct_eventId_idx" ON "EventCommercialProduct"("eventId");

CREATE TABLE "EventDebriefReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deliveryDate" DATETIME,
    "summary" TEXT,
    "fileUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventDebriefReport_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "EventDebriefReport_eventId_idx" ON "EventDebriefReport"("eventId");
