-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "deviceInfo" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);
