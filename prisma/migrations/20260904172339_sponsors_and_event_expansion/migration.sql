-- AlterTable
ALTER TABLE "Event" ADD COLUMN "enpsDay1Url" TEXT;
ALTER TABLE "Event" ADD COLUMN "enpsDay2Url" TEXT;
ALTER TABLE "Event" ADD COLUMN "enpsDay3Url" TEXT;
ALTER TABLE "Event" ADD COLUMN "npsExcelComments" TEXT;
ALTER TABLE "Event" ADD COLUMN "npsExcelUrl" TEXT;
ALTER TABLE "Event" ADD COLUMN "venueAddress" TEXT;
ALTER TABLE "Event" ADD COLUMN "venueCost" REAL;
ALTER TABLE "Event" ADD COLUMN "venueNotes" TEXT;

-- AlterTable
ALTER TABLE "EventAttendee" ADD COLUMN "cpfRg" TEXT;
ALTER TABLE "EventAttendee" ADD COLUMN "dynamicChoice" TEXT;
ALTER TABLE "EventAttendee" ADD COLUMN "dynamicOther" TEXT;
ALTER TABLE "EventAttendee" ADD COLUMN "instagram" TEXT;

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "totalValue" REAL NOT NULL,
    "paymentPlan" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentLink" TEXT,
    "paymentProofUrl" TEXT,
    "hasStageTime" BOOLEAN NOT NULL DEFAULT false,
    "stageTimeMinutes" INTEGER,
    "eventId" TEXT,
    "isAnnual" BOOLEAN NOT NULL DEFAULT false,
    "tier" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'em_negociacao',
    "statusOther" TEXT,
    "nfUrl" TEXT,
    "presentationUrl" TEXT,
    "logoUrl" TEXT,
    "videoUrl" TEXT,
    "activation" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sponsor_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sponsor_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SponsorInstallment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sponsorId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidDate" DATETIME,
    CONSTRAINT "SponsorInstallment_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SponsorInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sponsorId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SponsorInteraction_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SponsorInteraction_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SponsorLeadSale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sponsorId" TEXT NOT NULL,
    "description" TEXT,
    "value" REAL NOT NULL,
    "saleDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SponsorLeadSale_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventDinnerGuest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "empresa" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventDinnerGuest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventCommsItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "time" TEXT,
    "artUrl" TEXT,
    "artLink" TEXT,
    "message" TEXT NOT NULL,
    "objective" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planejado',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventCommsItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EventBudgetLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "description" TEXT,
    "supplier" TEXT,
    "supplierCnpj" TEXT,
    "supplierContact" TEXT,
    "supplierPhone" TEXT,
    "quantity" REAL,
    "unitValue" REAL,
    "nfUrl" TEXT,
    "paymentMethod" TEXT,
    "status" TEXT,
    "plannedValue" REAL,
    "actualValue" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventBudgetLine_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EventBudgetLine" ("actualValue", "category", "createdAt", "description", "eventId", "id", "item", "paymentMethod", "plannedValue", "status", "supplier") SELECT "actualValue", "category", "createdAt", "description", "eventId", "id", "item", "paymentMethod", "plannedValue", "status", "supplier" FROM "EventBudgetLine";
DROP TABLE "EventBudgetLine";
ALTER TABLE "new_EventBudgetLine" RENAME TO "EventBudgetLine";

-- DataMigration: category virou enum (EventBudgetCategory) — SQLite não
-- valida o tipo na coluna, então qualquer valor livre antigo (ex.: import de
-- planilha) precisa ser normalizado pra um valor válido do enum, ou o Prisma
-- Client quebra ao ler essas linhas depois.
UPDATE "EventBudgetLine"
SET "category" = 'outro'
WHERE "category" NOT IN (
    'press_kit_gold', 'press_kit_vip', 'a_e_b', 'audiovisual',
    'cenografia', 'staff', 'reembolsos', 'outro'
);
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "product" TEXT,
    "areaId" TEXT NOT NULL,
    "projectId" TEXT,
    "assigneeId" TEXT NOT NULL,
    "deadline" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'no_ritmo',
    "priority" TEXT NOT NULL DEFAULT 'media',
    "note" TEXT,
    "completedAt" DATETIME,
    "customerId" TEXT,
    "recurrence" TEXT,
    "contentPostId" TEXT,
    "sponsorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_contentPostId_fkey" FOREIGN KEY ("contentPostId") REFERENCES "ContentCalendarPost" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("areaId", "assigneeId", "completedAt", "contentPostId", "createdAt", "customerId", "deadline", "description", "id", "note", "priority", "product", "projectId", "recurrence", "status", "title", "updatedAt") SELECT "areaId", "assigneeId", "completedAt", "contentPostId", "createdAt", "customerId", "deadline", "description", "id", "note", "priority", "product", "projectId", "recurrence", "status", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_contentPostId_idx" ON "Task"("contentPostId");
CREATE INDEX "Task_sponsorId_idx" ON "Task"("sponsorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Sponsor_eventId_idx" ON "Sponsor"("eventId");

-- CreateIndex
CREATE INDEX "SponsorInstallment_sponsorId_idx" ON "SponsorInstallment"("sponsorId");

-- CreateIndex
CREATE INDEX "SponsorInteraction_sponsorId_idx" ON "SponsorInteraction"("sponsorId");

-- CreateIndex
CREATE INDEX "SponsorLeadSale_sponsorId_idx" ON "SponsorLeadSale"("sponsorId");

-- CreateIndex
CREATE INDEX "EventDinnerGuest_eventId_idx" ON "EventDinnerGuest"("eventId");

-- CreateIndex
CREATE INDEX "EventCommsItem_eventId_idx" ON "EventCommsItem"("eventId");
