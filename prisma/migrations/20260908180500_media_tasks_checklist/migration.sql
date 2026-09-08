-- AlterTable
ALTER TABLE "Event" DROP COLUMN "mediaScopePlanned";
ALTER TABLE "Event" DROP COLUMN "mediaScopeActual";

-- CreateTable
CREATE TABLE "EventMediaTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventMediaTask_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "EventMediaTask_eventId_idx" ON "EventMediaTask"("eventId");
