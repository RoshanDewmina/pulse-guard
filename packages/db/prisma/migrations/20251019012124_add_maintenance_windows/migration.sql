-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "maintenanceWindowId" TEXT;

-- CreateTable
CREATE TABLE "MaintenanceWindow" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceWindow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaintenanceWindow_orgId_idx" ON "MaintenanceWindow"("orgId");

-- CreateIndex
CREATE INDEX "MaintenanceWindow_startAt_endAt_idx" ON "MaintenanceWindow"("startAt", "endAt");

-- CreateIndex
CREATE INDEX "MaintenanceWindow_isActive_idx" ON "MaintenanceWindow"("isActive");

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_maintenanceWindowId_fkey" FOREIGN KEY ("maintenanceWindowId") REFERENCES "MaintenanceWindow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceWindow" ADD CONSTRAINT "MaintenanceWindow_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
