-- AlterTable
ALTER TABLE "SocialSellingLead" ADD COLUMN "saleProduct" TEXT;
ALTER TABLE "SocialSellingLead" ADD COLUMN "saleValue" REAL;
ALTER TABLE "SocialSellingLead" ADD COLUMN "saleDate" DATETIME;

-- CreateTable
CREATE TABLE "SocialProfileReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT,
    "externalUrl" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialProfileReport_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "SocialProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SocialProfileReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SocialProfileReport_profileId_idx" ON "SocialProfileReport"("profileId");
