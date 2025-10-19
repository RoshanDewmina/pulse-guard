-- CreateEnum
CREATE TYPE "MonitorType" AS ENUM ('HEARTBEAT', 'HTTP_CHECK');

-- CreateEnum
CREATE TYPE "HttpMethod" AS ENUM ('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS');

-- AlterTable
ALTER TABLE "Monitor" ADD COLUMN     "expectedStatusCode" INTEGER DEFAULT 200,
ADD COLUMN     "httpBody" TEXT,
ADD COLUMN     "httpHeaders" JSONB,
ADD COLUMN     "httpMethod" "HttpMethod" DEFAULT 'GET',
ADD COLUMN     "monitorType" "MonitorType" NOT NULL DEFAULT 'HEARTBEAT',
ADD COLUMN     "responseAssertions" JSONB,
ADD COLUMN     "responseTimeSla" INTEGER;
