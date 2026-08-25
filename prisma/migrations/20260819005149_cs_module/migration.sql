-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "product" TEXT NOT NULL,
    "csId" TEXT NOT NULL,
    "entryDate" DATETIME NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "renewalDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "mrr" REAL,
    "contractValue" REAL,
    "lastContactAt" DATETIME,
    "nextContactAt" DATETIME,
    "notes" TEXT,
    "contractUrl" TEXT,
    "otherDocsUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Customer_csId_fkey" FOREIGN KEY ("csId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomerInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerInteraction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerInteraction_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomerRenewal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "plannedValue" REAL NOT NULL,
    "realizedValue" REAL,
    "realizedDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'disponivel',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerRenewal_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomerExperience" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "score" INTEGER,
    "feedback" TEXT,
    "positives" TEXT,
    "negatives" TEXT,
    "opportunities" TEXT,
    "needsFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "followUpOwnerId" TEXT,
    "followUpDate" DATETIME,
    "followUpDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerExperience_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerExperience_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerExperience_followUpOwnerId_fkey" FOREIGN KEY ("followUpOwnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
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
    CONSTRAINT "EventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventAttendee_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EventAttendee" ("category", "checkedIn", "confirmed", "createdAt", "email", "empresa", "eventId", "id", "name", "npsScore", "phone", "ticketType") SELECT "category", "checkedIn", "confirmed", "createdAt", "email", "empresa", "eventId", "id", "name", "npsScore", "phone", "ticketType" FROM "EventAttendee";
DROP TABLE "EventAttendee";
ALTER TABLE "new_EventAttendee" RENAME TO "EventAttendee";
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("areaId", "assigneeId", "completedAt", "createdAt", "deadline", "description", "id", "note", "priority", "product", "projectId", "status", "title", "updatedAt") SELECT "areaId", "assigneeId", "completedAt", "createdAt", "deadline", "description", "id", "note", "priority", "product", "projectId", "status", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Customer_csId_idx" ON "Customer"("csId");

-- CreateIndex
CREATE INDEX "Customer_product_idx" ON "Customer"("product");

-- CreateIndex
CREATE INDEX "CustomerInteraction_customerId_idx" ON "CustomerInteraction"("customerId");

-- CreateIndex
CREATE INDEX "CustomerRenewal_customerId_idx" ON "CustomerRenewal"("customerId");

-- CreateIndex
CREATE INDEX "CustomerRenewal_dueDate_idx" ON "CustomerRenewal"("dueDate");

-- CreateIndex
CREATE INDEX "CustomerExperience_customerId_idx" ON "CustomerExperience"("customerId");

-- CreateIndex
CREATE INDEX "CustomerExperience_eventId_idx" ON "CustomerExperience"("eventId");
