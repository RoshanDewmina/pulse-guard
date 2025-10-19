/*
  Warnings:

  - You are about to drop the column `tags` on the `Monitor` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DataExportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SyntheticStepType" AS ENUM ('NAVIGATE', 'CLICK', 'FILL', 'SELECT', 'WAIT', 'SCREENSHOT', 'ASSERTION', 'CUSTOM_SCRIPT');

-- CreateEnum
CREATE TYPE "SyntheticRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'TIMEOUT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SyntheticStepStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ReportPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PostMortemStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('NONE', 'STARTED', 'MONITOR_CREATED', 'ALERT_CONNECTED', 'TEST_ALERT', 'DONE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ChannelType" ADD VALUE 'PAGERDUTY';
ALTER TYPE "ChannelType" ADD VALUE 'TEAMS';
ALTER TYPE "ChannelType" ADD VALUE 'SMS';

-- AlterTable
ALTER TABLE "Monitor" DROP COLUMN "tags",
ADD COLUMN     "anomalyMedianMultiplier" DOUBLE PRECISION DEFAULT 5.0,
ADD COLUMN     "anomalyOutputDropFraction" DOUBLE PRECISION DEFAULT 0.5,
ADD COLUMN     "anomalyZScoreThreshold" DOUBLE PRECISION DEFAULT 3.0,
ADD COLUMN     "checkDomain" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "checkSsl" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "domainAlertThresholds" INTEGER[] DEFAULT ARRAY[60, 30, 14]::INTEGER[],
ADD COLUMN     "sslAlertThresholds" INTEGER[] DEFAULT ARRAY[30, 14, 7]::INTEGER[];

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "allowsAuditLogs" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowsCustomDomains" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowsSso" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowsWebhooks" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "minIntervalSec" INTEGER NOT NULL DEFAULT 600,
ADD COLUMN     "retentionDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "statusPageLimit" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "syntheticRunsLimit" INTEGER NOT NULL DEFAULT 200,
ADD COLUMN     "syntheticRunsUsed" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "imageUrl",
ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ADD COLUMN     "mfaBackupCodesEnc" TEXT,
ADD COLUMN     "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mfaLastVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "mfaTotpSecretEnc" TEXT,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingStep" "OnboardingStep" NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "DataExport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "DataExportStatus" NOT NULL DEFAULT 'PENDING',
    "s3Key" TEXT,
    "downloadUrl" TEXT,
    "fileSize" INTEGER,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMsg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SslCertificate" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "issuer" TEXT,
    "subject" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "daysUntilExpiry" INTEGER NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "isSelfSigned" BOOLEAN NOT NULL DEFAULT false,
    "chainValid" BOOLEAN NOT NULL DEFAULT true,
    "validationError" TEXT,
    "serialNumber" TEXT,
    "fingerprint" TEXT,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SslCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainExpiration" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "registrar" TEXT,
    "registeredAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "daysUntilExpiry" INTEGER NOT NULL,
    "autoRenew" BOOLEAN,
    "nameservers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "whoisServer" TEXT,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainExpiration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyntheticMonitor" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "intervalMinutes" INTEGER NOT NULL DEFAULT 5,
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "viewport" JSONB,
    "userAgent" TEXT,
    "headers" JSONB,
    "cookies" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "lastStatus" "SyntheticRunStatus",

    CONSTRAINT "SyntheticMonitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyntheticStep" (
    "id" TEXT NOT NULL,
    "syntheticMonitorId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "SyntheticStepType" NOT NULL,
    "label" TEXT NOT NULL,
    "selector" TEXT,
    "value" TEXT,
    "url" TEXT,
    "timeout" INTEGER NOT NULL DEFAULT 5000,
    "screenshot" BOOLEAN NOT NULL DEFAULT false,
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyntheticStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyntheticRun" (
    "id" TEXT NOT NULL,
    "syntheticMonitorId" TEXT NOT NULL,
    "status" "SyntheticRunStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    "screenshots" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyntheticRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyntheticStepResult" (
    "id" TEXT NOT NULL,
    "syntheticRunId" TEXT NOT NULL,
    "syntheticStepId" TEXT NOT NULL,
    "status" "SyntheticStepStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    "screenshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyntheticStepResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlaReport" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "monitorId" TEXT,
    "name" TEXT NOT NULL,
    "period" "ReportPeriod" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT,
    "uptimePercentage" DOUBLE PRECISION NOT NULL,
    "totalChecks" INTEGER NOT NULL,
    "successfulChecks" INTEGER NOT NULL,
    "failedChecks" INTEGER NOT NULL,
    "totalDowntimeMs" INTEGER NOT NULL,
    "mttr" INTEGER,
    "mtbf" INTEGER,
    "incidentCount" INTEGER NOT NULL,
    "averageResponseTime" DOUBLE PRECISION,
    "p95ResponseTime" DOUBLE PRECISION,
    "p99ResponseTime" DOUBLE PRECISION,
    "data" JSONB NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlaReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostMortem" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "impact" TEXT,
    "rootCause" TEXT,
    "timeline" JSONB NOT NULL,
    "actionItems" JSONB NOT NULL,
    "contributors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PostMortemStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "PostMortem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitorTag" (
    "monitorId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "MonitorTag_pkey" PRIMARY KEY ("monitorId","tagId")
);

-- CreateIndex
CREATE INDEX "DataExport_userId_idx" ON "DataExport"("userId");

-- CreateIndex
CREATE INDEX "DataExport_status_idx" ON "DataExport"("status");

-- CreateIndex
CREATE INDEX "DataExport_expiresAt_idx" ON "DataExport"("expiresAt");

-- CreateIndex
CREATE INDEX "SslCertificate_monitorId_idx" ON "SslCertificate"("monitorId");

-- CreateIndex
CREATE INDEX "SslCertificate_expiresAt_idx" ON "SslCertificate"("expiresAt");

-- CreateIndex
CREATE INDEX "SslCertificate_daysUntilExpiry_idx" ON "SslCertificate"("daysUntilExpiry");

-- CreateIndex
CREATE INDEX "SslCertificate_lastCheckedAt_idx" ON "SslCertificate"("lastCheckedAt");

-- CreateIndex
CREATE INDEX "DomainExpiration_monitorId_idx" ON "DomainExpiration"("monitorId");

-- CreateIndex
CREATE INDEX "DomainExpiration_expiresAt_idx" ON "DomainExpiration"("expiresAt");

-- CreateIndex
CREATE INDEX "DomainExpiration_daysUntilExpiry_idx" ON "DomainExpiration"("daysUntilExpiry");

-- CreateIndex
CREATE INDEX "DomainExpiration_lastCheckedAt_idx" ON "DomainExpiration"("lastCheckedAt");

-- CreateIndex
CREATE INDEX "SyntheticMonitor_orgId_idx" ON "SyntheticMonitor"("orgId");

-- CreateIndex
CREATE INDEX "SyntheticMonitor_isEnabled_idx" ON "SyntheticMonitor"("isEnabled");

-- CreateIndex
CREATE INDEX "SyntheticMonitor_lastRunAt_idx" ON "SyntheticMonitor"("lastRunAt");

-- CreateIndex
CREATE INDEX "SyntheticStep_syntheticMonitorId_idx" ON "SyntheticStep"("syntheticMonitorId");

-- CreateIndex
CREATE INDEX "SyntheticStep_order_idx" ON "SyntheticStep"("order");

-- CreateIndex
CREATE INDEX "SyntheticRun_syntheticMonitorId_idx" ON "SyntheticRun"("syntheticMonitorId");

-- CreateIndex
CREATE INDEX "SyntheticRun_startedAt_idx" ON "SyntheticRun"("startedAt");

-- CreateIndex
CREATE INDEX "SyntheticRun_status_idx" ON "SyntheticRun"("status");

-- CreateIndex
CREATE INDEX "SyntheticStepResult_syntheticRunId_idx" ON "SyntheticStepResult"("syntheticRunId");

-- CreateIndex
CREATE INDEX "SyntheticStepResult_syntheticStepId_idx" ON "SyntheticStepResult"("syntheticStepId");

-- CreateIndex
CREATE INDEX "SlaReport_orgId_idx" ON "SlaReport"("orgId");

-- CreateIndex
CREATE INDEX "SlaReport_monitorId_idx" ON "SlaReport"("monitorId");

-- CreateIndex
CREATE INDEX "SlaReport_startDate_idx" ON "SlaReport"("startDate");

-- CreateIndex
CREATE INDEX "SlaReport_endDate_idx" ON "SlaReport"("endDate");

-- CreateIndex
CREATE INDEX "SlaReport_generatedAt_idx" ON "SlaReport"("generatedAt");

-- CreateIndex
CREATE INDEX "PostMortem_orgId_idx" ON "PostMortem"("orgId");

-- CreateIndex
CREATE INDEX "PostMortem_incidentId_idx" ON "PostMortem"("incidentId");

-- CreateIndex
CREATE INDEX "PostMortem_status_idx" ON "PostMortem"("status");

-- CreateIndex
CREATE INDEX "PostMortem_publishedAt_idx" ON "PostMortem"("publishedAt");

-- CreateIndex
CREATE INDEX "PostMortem_createdAt_idx" ON "PostMortem"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Tag_orgId_idx" ON "Tag"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_orgId_name_key" ON "Tag"("orgId", "name");

-- CreateIndex
CREATE INDEX "MonitorTag_monitorId_idx" ON "MonitorTag"("monitorId");

-- CreateIndex
CREATE INDEX "MonitorTag_tagId_idx" ON "MonitorTag"("tagId");

-- AddForeignKey
ALTER TABLE "DataExport" ADD CONSTRAINT "DataExport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SslCertificate" ADD CONSTRAINT "SslCertificate_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainExpiration" ADD CONSTRAINT "DomainExpiration_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyntheticMonitor" ADD CONSTRAINT "SyntheticMonitor_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyntheticStep" ADD CONSTRAINT "SyntheticStep_syntheticMonitorId_fkey" FOREIGN KEY ("syntheticMonitorId") REFERENCES "SyntheticMonitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyntheticRun" ADD CONSTRAINT "SyntheticRun_syntheticMonitorId_fkey" FOREIGN KEY ("syntheticMonitorId") REFERENCES "SyntheticMonitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyntheticStepResult" ADD CONSTRAINT "SyntheticStepResult_syntheticRunId_fkey" FOREIGN KEY ("syntheticRunId") REFERENCES "SyntheticRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyntheticStepResult" ADD CONSTRAINT "SyntheticStepResult_syntheticStepId_fkey" FOREIGN KEY ("syntheticStepId") REFERENCES "SyntheticStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlaReport" ADD CONSTRAINT "SlaReport_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlaReport" ADD CONSTRAINT "SlaReport_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMortem" ADD CONSTRAINT "PostMortem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMortem" ADD CONSTRAINT "PostMortem_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitorTag" ADD CONSTRAINT "MonitorTag_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitorTag" ADD CONSTRAINT "MonitorTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
