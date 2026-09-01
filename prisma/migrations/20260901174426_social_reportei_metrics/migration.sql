-- CreateTable
CREATE TABLE "SocialReporteiMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "periodLabel" TEXT,
    "value" TEXT NOT NULL,
    "deltaLabel" TEXT,
    "previousLabel" TEXT,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialReporteiMetric_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "SocialProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialReporteiInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialReporteiInsight_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "SocialProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SocialReporteiMetric_profileId_idx" ON "SocialReporteiMetric"("profileId");

-- CreateIndex
CREATE INDEX "SocialReporteiInsight_profileId_idx" ON "SocialReporteiInsight"("profileId");
