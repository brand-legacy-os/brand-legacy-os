-- Comercial: faturamento/pipeline (GoHighLevel Opportunities) e reuniões (Calendly)
CREATE TABLE "GhlOpportunity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monetaryValue" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "pipelineName" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "stageName" TEXT,
    "channel" TEXT NOT NULL,
    "product" TEXT,
    "assignedToEmail" TEXT,
    "createdAt" DATETIME NOT NULL,
    "wonAt" DATETIME,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "GhlOpportunity_externalId_key" ON "GhlOpportunity"("externalId");
CREATE INDEX "GhlOpportunity_createdAt_idx" ON "GhlOpportunity"("createdAt");
CREATE INDEX "GhlOpportunity_wonAt_idx" ON "GhlOpportunity"("wonAt");
CREATE INDEX "GhlOpportunity_status_idx" ON "GhlOpportunity"("status");
CREATE INDEX "GhlOpportunity_assignedToEmail_idx" ON "GhlOpportunity"("assignedToEmail");
CREATE INDEX "GhlOpportunity_channel_idx" ON "GhlOpportunity"("channel");

CREATE TABLE "CalendlyMeeting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT NOT NULL,
    "eventTypeName" TEXT NOT NULL,
    "assigneeEmail" TEXT,
    "startTime" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "noShow" BOOLEAN NOT NULL DEFAULT false,
    "utmSource" TEXT,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "CalendlyMeeting_externalId_key" ON "CalendlyMeeting"("externalId");
CREATE INDEX "CalendlyMeeting_startTime_idx" ON "CalendlyMeeting"("startTime");
CREATE INDEX "CalendlyMeeting_assigneeEmail_idx" ON "CalendlyMeeting"("assigneeEmail");
