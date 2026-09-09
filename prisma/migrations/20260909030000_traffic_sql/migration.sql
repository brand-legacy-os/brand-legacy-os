CREATE TABLE "TrafficSqlLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isAdvanced" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "TrafficSqlLead_externalId_key" ON "TrafficSqlLead"("externalId");
CREATE INDEX "TrafficSqlLead_createdAt_idx" ON "TrafficSqlLead"("createdAt");
