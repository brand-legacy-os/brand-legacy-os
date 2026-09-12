-- EventAttendee: campo de indicações (quem indicou a marca) — rebuild de
-- tabela (padrão SQLite) pra poder adicionar a FK auto-referenciada
-- referrerAttendeeId com CONSTRAINT de verdade.
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_EventAttendee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "empresa" TEXT,
    "category" TEXT NOT NULL,
    "ticketType" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT true,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "npsScore" INTEGER,
    "customerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cpfRg" TEXT,
    "dynamicChoice" TEXT,
    "dynamicOther" TEXT,
    "instagram" TEXT,
    "gender" TEXT,
    "revenueRange" TEXT,
    "instagramPersonal" TEXT,
    "focalPerson" TEXT,
    "inWhatsappGroup" BOOLEAN NOT NULL DEFAULT false,
    "inDinner" BOOLEAN NOT NULL DEFAULT false,
    "segmento" TEXT,
    "referrerAttendeeId" TEXT,
    "referrerName" TEXT,
    "referrerEmpresa" TEXT,
    "referrerWhatsapp" TEXT,
    CONSTRAINT "EventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventAttendee_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EventAttendee_referrerAttendeeId_fkey" FOREIGN KEY ("referrerAttendeeId") REFERENCES "EventAttendee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_EventAttendee" (
    "id", "eventId", "name", "empresa", "category", "ticketType", "email", "phone",
    "confirmed", "checkedIn", "npsScore", "customerId", "createdAt", "cpfRg",
    "dynamicChoice", "dynamicOther", "instagram", "gender", "revenueRange",
    "instagramPersonal", "focalPerson", "inWhatsappGroup", "inDinner", "segmento"
) SELECT
    "id", "eventId", "name", "empresa", "category", "ticketType", "email", "phone",
    "confirmed", "checkedIn", "npsScore", "customerId", "createdAt", "cpfRg",
    "dynamicChoice", "dynamicOther", "instagram", "gender", "revenueRange",
    "instagramPersonal", "focalPerson", "inWhatsappGroup", "inDinner", "segmento"
FROM "EventAttendee";

DROP TABLE "EventAttendee";
ALTER TABLE "new_EventAttendee" RENAME TO "EventAttendee";

CREATE INDEX "EventAttendee_referrerAttendeeId_idx" ON "EventAttendee"("referrerAttendeeId");

PRAGMA foreign_keys=ON;
