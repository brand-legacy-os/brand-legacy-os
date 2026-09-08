-- TaskAttachment
CREATE TABLE "TaskAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskAttachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "TaskAttachment_taskId_idx" ON "TaskAttachment"("taskId");

-- PodcastEpisode: remap existing status values to the new vocabulary
UPDATE "PodcastEpisode" SET "status" = 'material_em_edicao' WHERE "status" = 'editando';
UPDATE "PodcastEpisode" SET "status" = 'esperando_material' WHERE "status" = 'gravacao_disponivel';
UPDATE "PodcastEpisode" SET "status" = 'episodio_agendado' WHERE "status" = 'agendado';
UPDATE "PodcastEpisode" SET "status" = 'entrevista_reagendando' WHERE "status" = 'reagendar';

-- PodcastEpisode: new columns
ALTER TABLE "PodcastEpisode" ADD COLUMN "sourceOther" TEXT;
ALTER TABLE "PodcastEpisode" ADD COLUMN "recordingResponsibleId" TEXT;
ALTER TABLE "PodcastEpisode" ADD COLUMN "materialResponsibleId" TEXT;
ALTER TABLE "PodcastEpisode" ADD COLUMN "postResponsibleId" TEXT;
ALTER TABLE "PodcastEpisode" ADD COLUMN "transcript" TEXT;
ALTER TABLE "PodcastEpisode" ADD COLUMN "dispatchCopy" TEXT;
ALTER TABLE "PodcastEpisode" ADD COLUMN "dispatchDate" DATETIME;
ALTER TABLE "PodcastEpisode" ADD COLUMN "dispatchResponsibleId" TEXT;
ALTER TABLE "PodcastEpisode" ADD COLUMN "dispatchStatus" TEXT;

-- SocialProfileReport: new columns + migrate old single file/link into attachments
ALTER TABLE "SocialProfileReport" ADD COLUMN "reportMonth" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SocialProfileReport" ADD COLUMN "dueDate" DATETIME;
ALTER TABLE "SocialProfileReport" ADD COLUMN "periodAnalyzed" TEXT;
ALTER TABLE "SocialProfileReport" ADD COLUMN "summary" TEXT;

CREATE TABLE "SocialProfileReportAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialProfileReportAttachment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "SocialProfileReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "SocialProfileReportAttachment_reportId_idx" ON "SocialProfileReportAttachment"("reportId");

INSERT INTO "SocialProfileReportAttachment" ("id", "reportId", "label", "url", "createdAt")
SELECT lower(hex(randomblob(16))), "id", 'Arquivo', "fileUrl", "createdAt" FROM "SocialProfileReport" WHERE "fileUrl" IS NOT NULL;
INSERT INTO "SocialProfileReportAttachment" ("id", "reportId", "label", "url", "createdAt")
SELECT lower(hex(randomblob(16))), "id", 'Link', "externalUrl", "createdAt" FROM "SocialProfileReport" WHERE "externalUrl" IS NOT NULL;

ALTER TABLE "SocialProfileReport" DROP COLUMN "fileUrl";
ALTER TABLE "SocialProfileReport" DROP COLUMN "externalUrl";

-- SocialReporteiPost
CREATE TABLE "SocialReporteiPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "postLabel" TEXT NOT NULL,
    "type" TEXT,
    "alcance" REAL,
    "visualizacoes" REAL,
    "curtidas" REAL,
    "comentarios" REAL,
    "salvamentos" REAL,
    "compartilhamentos" REAL,
    "postedAt" DATETIME,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialReporteiPost_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "SocialProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SocialReporteiPost_profileId_postLabel_postedAt_key" ON "SocialReporteiPost"("profileId", "postLabel", "postedAt");
CREATE INDEX "SocialReporteiPost_profileId_idx" ON "SocialReporteiPost"("profileId");

-- SocialFollowerSnapshot
CREATE TABLE "SocialFollowerSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SocialFollowerSnapshot_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "SocialProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SocialFollowerSnapshot_profileId_monthKey_key" ON "SocialFollowerSnapshot"("profileId", "monthKey");
