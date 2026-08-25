-- CreateTable
CREATE TABLE "PerformanceSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "PerformanceMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "target" TEXT,
    "realized" TEXT,
    "order" INTEGER NOT NULL,
    CONSTRAINT "PerformanceMetric_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "PerformanceSection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PerformanceMetric_sectionId_idx" ON "PerformanceMetric"("sectionId");
