-- CreateTable
CREATE TABLE "CsAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "link" TEXT,
    "materialsUrl" TEXT,
    "date" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CsAction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CsActionCalendarItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" TEXT NOT NULL,
    "date" TEXT,
    "time" TEXT,
    "eventName" TEXT NOT NULL,
    "responsible" TEXT,
    "audience" TEXT,
    "status" TEXT,
    "notes" TEXT
);
