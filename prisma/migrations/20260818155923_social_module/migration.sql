-- CreateTable
CREATE TABLE "SocialProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "personId" TEXT,
    "isInstitutional" BOOLEAN NOT NULL DEFAULT false,
    "reporteiUrl" TEXT,
    "contentScope" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SocialProfile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PodcastEpisode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "episodeNumber" INTEGER NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SocialSellingLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadName" TEXT NOT NULL,
    "companyName" TEXT,
    "contactPerson" TEXT,
    "salespersonId" TEXT,
    "meetingDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'sem_resposta',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialSellingLead_salespersonId_fkey" FOREIGN KEY ("salespersonId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentCalendarPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "profileId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planejado',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentCalendarPost_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "SocialProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentCalendarPost_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
