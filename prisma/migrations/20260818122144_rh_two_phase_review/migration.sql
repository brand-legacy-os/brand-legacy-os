-- AlterTable
ALTER TABLE "RhReview" ADD COLUMN "leaderClassification" TEXT;
ALTER TABLE "RhReview" ADD COLUMN "leaderSubmittedAt" DATETIME;
ALTER TABLE "RhReview" ADD COLUMN "selfClassification" TEXT;
ALTER TABLE "RhReview" ADD COLUMN "selfContributionReason" TEXT;
ALTER TABLE "RhReview" ADD COLUMN "selfContributionScore" INTEGER;
ALTER TABLE "RhReview" ADD COLUMN "selfFeedbackToLeader" TEXT;
ALTER TABLE "RhReview" ADD COLUMN "selfSubmittedAt" DATETIME;
ALTER TABLE "RhReview" ADD COLUMN "selfWorkLifeBalance" TEXT;
