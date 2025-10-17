-- AlterTable: Update Account model to match NextAuth Prisma Adapter schema
-- This migration renames fields and adds new ones to match NextAuth's expected schema

-- Step 1: Add new columns (IF NOT EXISTS to handle partial migrations)
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "providerAccountId" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "refresh_token" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "access_token" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "expires_at" INTEGER;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "token_type" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "id_token" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "session_state" TEXT;

-- Step 2: Copy data from old columns to new columns (only if old columns exist)
DO $$ 
BEGIN
  -- Only copy if old columns still exist
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Account' AND column_name = 'providerId') THEN
    UPDATE "Account" SET 
      "type" = CASE 
        WHEN "provider" = 'credentials' THEN 'credentials'
        ELSE 'oauth'
      END,
      "providerAccountId" = "providerId",
      "access_token" = "accessToken",
      "refresh_token" = "refreshToken"
    WHERE "type" IS NULL OR "providerAccountId" IS NULL;
  END IF;
END $$;

-- Step 3: Make required columns NOT NULL (only if they're not already)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'Account' AND column_name = 'type' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "Account" ALTER COLUMN "type" SET NOT NULL;
  END IF;
  
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'Account' AND column_name = 'providerAccountId' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "Account" ALTER COLUMN "providerAccountId" SET NOT NULL;
  END IF;
END $$;

-- Step 4: Drop old unique constraint (if it exists)
ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "Account_provider_providerId_key";

-- Step 5: Add new unique constraint (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_indexes WHERE indexname = 'Account_provider_providerAccountId_key'
  ) THEN
    CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" 
    ON "Account"("provider", "providerAccountId");
  END IF;
END $$;

-- Step 6: Drop old columns (if they exist)
ALTER TABLE "Account" DROP COLUMN IF EXISTS "providerId";
ALTER TABLE "Account" DROP COLUMN IF EXISTS "accessToken";
ALTER TABLE "Account" DROP COLUMN IF EXISTS "refreshToken";

