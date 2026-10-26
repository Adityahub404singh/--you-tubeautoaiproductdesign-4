-- Additive migration only: preserves existing users and tables.
CREATE TABLE "SocialAccount" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "platformUserId" TEXT NOT NULL,
  "accountName" TEXT NOT NULL,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT,
  "accessTokenExpiry" DATETIME,
  "scopes" TEXT NOT NULL DEFAULT '',
  "isConnected" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SocialAccount_provider_platformUserId_key" ON "SocialAccount"("provider", "platformUserId");
CREATE INDEX "SocialAccount_userId_provider_idx" ON "SocialAccount"("userId", "provider");
