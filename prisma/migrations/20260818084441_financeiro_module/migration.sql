-- CreateTable
CREATE TABLE "CashAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "balance" REAL NOT NULL,
    "snapshotDate" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CashMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FinanceCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "FinanceEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "realizado" REAL,
    "previsto" REAL,
    CONSTRAINT "FinanceEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FinanceCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fornecedor" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "centroCusto" TEXT,
    "competencia" TEXT NOT NULL,
    "vencimento" DATETIME NOT NULL,
    "pagamento" DATETIME,
    "valorPrevisto" REAL NOT NULL,
    "valorRealizado" REAL,
    "formaPagamento" TEXT,
    "contaBancaria" TEXT,
    "responsavelId" TEXT,
    "observacoes" TEXT,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payable_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Receivable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cliente" TEXT NOT NULL,
    "empresa" TEXT,
    "produto" TEXT,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "valorRecebido" REAL NOT NULL DEFAULT 0,
    "vencimento" DATETIME NOT NULL,
    "dataPrevista" DATETIME,
    "dataEfetiva" DATETIME,
    "formaPagamento" TEXT,
    "contaBancaria" TEXT,
    "responsavelId" TEXT,
    "observacoes" TEXT,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Receivable_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FinanceEntry_categoryId_periodKey_key" ON "FinanceEntry"("categoryId", "periodKey");
