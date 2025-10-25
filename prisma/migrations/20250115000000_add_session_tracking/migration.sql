-- Add session tracking fields to Token table
ALTER TABLE "Token" ADD COLUMN "sessionId" TEXT;
ALTER TABLE "Token" ADD COLUMN "deviceInfo" TEXT;
ALTER TABLE "Token" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "Token" ADD COLUMN "userAgent" TEXT;
ALTER TABLE "Token" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Create unique index on sessionId
CREATE UNIQUE INDEX "Token_sessionId_key" ON "Token"("sessionId");
