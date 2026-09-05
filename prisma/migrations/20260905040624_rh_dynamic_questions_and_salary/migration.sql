-- AlterTable
ALTER TABLE "RhReview" ADD COLUMN "selfClassificationReason" TEXT;
ALTER TABLE "RhReview" ADD COLUMN "selfAnswers" JSONB;
ALTER TABLE "RhReview" ADD COLUMN "leaderClassificationComment" TEXT;
ALTER TABLE "RhReview" ADD COLUMN "leaderComments" JSONB;
ALTER TABLE "RhReview" ADD COLUMN "leaderSalaryHistory" TEXT;
ALTER TABLE "RhReview" ADD COLUMN "leaderPostReviewSalary" REAL;
ALTER TABLE "RhReview" ADD COLUMN "leaderExceptionalBonus" REAL;
ALTER TABLE "RhReview" ADD COLUMN "leaderRoleChanged" BOOLEAN;
ALTER TABLE "RhReview" ADD COLUMN "leaderNextYearRole" TEXT;

-- CreateTable
CREATE TABLE "SalaryRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "areaLabel" TEXT NOT NULL,
    "salary" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalaryRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SalaryRecord_userId_key" ON "SalaryRecord"("userId");
