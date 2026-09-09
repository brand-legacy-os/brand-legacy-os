-- PodcastEpisode: episodeNumber vira opcional (leads no funil, sem número
-- de episódio atribuído ainda) — SQLite não suporta ALTER COLUMN, então
-- reconstrói a tabela.
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_PodcastEpisode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "episodeNumber" INTEGER,
    "guestName" TEXT NOT NULL,
    "guestBrand" TEXT,
    "recordingDate" DATETIME,
    "guestBrandInstagram" TEXT,
    "guestPersonalInstagram" TEXT,
    "materialDeadline" DATETIME,
    "postDate" DATETIME,
    "rawMaterialUrl" TEXT,
    "editedMaterialUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'agendado',
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceOther" TEXT,
    "recordingResponsibleId" TEXT,
    "materialResponsibleId" TEXT,
    "postResponsibleId" TEXT,
    "transcript" TEXT,
    "dispatchCopy" TEXT,
    "dispatchDate" DATETIME,
    "dispatchResponsibleId" TEXT,
    "dispatchStatus" TEXT,
    "recordingResponsibleOther" TEXT,
    "materialResponsibleOther" TEXT,
    "postResponsibleOther" TEXT,
    "dispatchResponsibleOther" TEXT
);

INSERT INTO "new_PodcastEpisode" (
    "id","episodeNumber","guestName","guestBrand","recordingDate","guestBrandInstagram",
    "guestPersonalInstagram","materialDeadline","postDate","rawMaterialUrl","editedMaterialUrl",
    "status","source","createdAt","sourceOther","recordingResponsibleId","materialResponsibleId",
    "postResponsibleId","transcript","dispatchCopy","dispatchDate","dispatchResponsibleId",
    "dispatchStatus","recordingResponsibleOther","materialResponsibleOther","postResponsibleOther",
    "dispatchResponsibleOther"
)
SELECT
    "id","episodeNumber","guestName","guestBrand","recordingDate","guestBrandInstagram",
    "guestPersonalInstagram","materialDeadline","postDate","rawMaterialUrl","editedMaterialUrl",
    "status","source","createdAt","sourceOther","recordingResponsibleId","materialResponsibleId",
    "postResponsibleId","transcript","dispatchCopy","dispatchDate","dispatchResponsibleId",
    "dispatchStatus","recordingResponsibleOther","materialResponsibleOther","postResponsibleOther",
    "dispatchResponsibleOther"
FROM "PodcastEpisode";

DROP TABLE "PodcastEpisode";
ALTER TABLE "new_PodcastEpisode" RENAME TO "PodcastEpisode";

PRAGMA foreign_keys=ON;

-- ContentWeekPlanCell — tabela de referência semanal da subárea "Conteúdo"
CREATE TABLE "ContentWeekPlanCell" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentWeekPlanCell_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "SocialProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ContentWeekPlanCell_profileId_weekday_key" ON "ContentWeekPlanCell"("profileId", "weekday");
