-- CreateTable
CREATE TABLE "EventBudgetLinePayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetLineId" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidDate" DATETIME,
    "cashMovementId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventBudgetLinePayment_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "EventBudgetLine" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventBudgetLinePayment_cashMovementId_fkey" FOREIGN KEY ("cashMovementId") REFERENCES "CashMovement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EventBudgetLinePayment_cashMovementId_key" ON "EventBudgetLinePayment"("cashMovementId");
