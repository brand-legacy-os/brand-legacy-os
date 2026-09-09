-- Tráfego: métricas reais do Windsor.ai (Facebook Ads + GoHighLevel)
CREATE TABLE "TrafficCampaignMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "objective" TEXT,
    "category" TEXT NOT NULL,
    "spend" REAL NOT NULL,
    "leads" REAL NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "TrafficCampaignMetric_campaignId_date_key" ON "TrafficCampaignMetric"("campaignId", "date");
CREATE INDEX "TrafficCampaignMetric_date_idx" ON "TrafficCampaignMetric"("date");
CREATE INDEX "TrafficCampaignMetric_category_idx" ON "TrafficCampaignMetric"("category");

CREATE TABLE "TrafficCampaignCategoryOverride" (
    "campaignId" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL
);

CREATE TABLE "TrafficAdMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "accountId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "adName" TEXT NOT NULL,
    "spend" REAL NOT NULL,
    "leads" REAL NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "TrafficAdMetric_adId_date_key" ON "TrafficAdMetric"("adId", "date");
CREATE INDEX "TrafficAdMetric_date_idx" ON "TrafficAdMetric"("date");

CREATE TABLE "TrafficMqlLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT NOT NULL,
    "contactName" TEXT,
    "dateAdded" DATETIME NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "TrafficMqlLead_externalId_key" ON "TrafficMqlLead"("externalId");
CREATE INDEX "TrafficMqlLead_dateAdded_idx" ON "TrafficMqlLead"("dateAdded");
