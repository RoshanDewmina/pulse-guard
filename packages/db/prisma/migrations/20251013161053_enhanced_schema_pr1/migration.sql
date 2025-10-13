-- CreateEnum for IncidentSeverity
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterEnum: Add VIEWER to Role
ALTER TYPE "Role" ADD VALUE 'VIEWER';

-- AlterEnum: Add DEGRADED to IncidentKind
ALTER TYPE "IncidentKind" ADD VALUE 'DEGRADED';

-- AlterEnum: Add PAGERDUTY, TEAMS, SMS to ChannelType
ALTER TYPE "ChannelType" ADD VALUE 'PAGERDUTY';
ALTER TYPE "ChannelType" ADD VALUE 'TEAMS';
ALTER TYPE "ChannelType" ADD VALUE 'SMS';

-- AlterTable: Add ipAllowlist to Org
ALTER TABLE "Org" ADD COLUMN "ipAllowlist" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable: Add percentile fields to Monitor
ALTER TABLE "Monitor" ADD COLUMN "durationP50" DOUBLE PRECISION;
ALTER TABLE "Monitor" ADD COLUMN "durationP95" DOUBLE PRECISION;
ALTER TABLE "Monitor" ADD COLUMN "durationP99" DOUBLE PRECISION;

-- AlterTable: Add outputPreview to Run
ALTER TABLE "Run" ADD COLUMN "outputPreview" TEXT;

-- AlterTable: Add severity and zScore to Incident
ALTER TABLE "Incident" ADD COLUMN "severity" "IncidentSeverity" NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "Incident" ADD COLUMN "zScore" DOUBLE PRECISION;

-- AlterTable: Add scopes to ApiKey
ALTER TABLE "ApiKey" ADD COLUMN "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable: Add cascadeReason to MonitorDependency
ALTER TABLE "MonitorDependency" ADD COLUMN "cascadeReason" TEXT;

-- CreateTable: StatusPage
CREATE TABLE "StatusPage" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "customDomain" TEXT,
    "accessToken" TEXT,
    "components" JSONB NOT NULL DEFAULT '[]',
    "theme" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique index on StatusPage slug
CREATE UNIQUE INDEX "StatusPage_slug_key" ON "StatusPage"("slug");

-- CreateIndex: Unique index on StatusPage accessToken
CREATE UNIQUE INDEX "StatusPage_accessToken_key" ON "StatusPage"("accessToken");

-- CreateIndex: Index on StatusPage orgId
CREATE INDEX "StatusPage_orgId_idx" ON "StatusPage"("orgId");

-- CreateIndex: Index on StatusPage slug
CREATE INDEX "StatusPage_slug_idx" ON "StatusPage"("slug");

-- CreateIndex: Composite index on Incident (monitorId, status, openedAt DESC)
CREATE INDEX "Incident_monitorId_status_openedAt_idx" ON "Incident"("monitorId", "status", "openedAt" DESC);

-- AddForeignKey: StatusPage to Org
ALTER TABLE "StatusPage" ADD CONSTRAINT "StatusPage_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

