-- AlterTable
ALTER TABLE "Monitor" ADD COLUMN     "durationCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "durationM2" DOUBLE PRECISION,
ADD COLUMN     "durationMax" INTEGER,
ADD COLUMN     "durationMean" DOUBLE PRECISION,
ADD COLUMN     "durationMedian" DOUBLE PRECISION,
ADD COLUMN     "durationMin" INTEGER;
