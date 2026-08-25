-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CashMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "eventId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CashMovement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CashMovement" ("amount", "createdAt", "date", "description", "id") SELECT "amount", "createdAt", "date", "description", "id" FROM "CashMovement";
DROP TABLE "CashMovement";
ALTER TABLE "new_CashMovement" RENAME TO "CashMovement";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
