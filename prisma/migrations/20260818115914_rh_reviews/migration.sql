-- CreateTable
CREATE TABLE "RhReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "rating" INTEGER,
    "highlights" TEXT,
    "improvements" TEXT,
    "actionItems" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RhReview_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RhReview_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RhReview_subjectId_idx" ON "RhReview"("subjectId");

-- CreateIndex
CREATE INDEX "RhReview_evaluatorId_idx" ON "RhReview"("evaluatorId");
