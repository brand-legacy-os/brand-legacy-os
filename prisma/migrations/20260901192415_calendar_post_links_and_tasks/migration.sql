-- CreateTable
CREATE TABLE "ContentCalendarPostLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentCalendarPostLink_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ContentCalendarPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_contentPostId_fkey" FOREIGN KEY ("contentPostId") REFERENCES "ContentCalendarPost" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("areaId", "assigneeId", "completedAt", "createdAt", "customerId", "deadline", "description", "id", "note", "priority", "product", "projectId", "recurrence", "status", "title", "updatedAt") SELECT "areaId", "assigneeId", "completedAt", "createdAt", "customerId", "deadline", "description", "id", "note", "priority", "product", "projectId", "recurrence", "status", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_contentPostId_idx" ON "Task"("contentPostId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ContentCalendarPostLink_postId_idx" ON "ContentCalendarPostLink"("postId");
