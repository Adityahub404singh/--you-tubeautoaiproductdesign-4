-- CreateTable
CREATE TABLE "ConceptHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConceptHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Video" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending-approval',
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "scheduledDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "retentionRate" REAL NOT NULL DEFAULT 0.0,
    "thumbnail" TEXT NOT NULL DEFAULT '',
    "topic" TEXT NOT NULL,
    "subCategory" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT NOT NULL DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "aiScore" INTEGER NOT NULL DEFAULT 75,
    "adminApproved" BOOLEAN NOT NULL DEFAULT false,
    "adminApprovedBy" TEXT,
    "adminApprovedAt" DATETIME,
    "userApproved" BOOLEAN NOT NULL DEFAULT false,
    "userApprovedAt" DATETIME,
    "cost" REAL NOT NULL DEFAULT 0,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "audioUrl" TEXT NOT NULL DEFAULT '',
    "thumbnailUrl" TEXT NOT NULL DEFAULT '',
    "script" TEXT NOT NULL DEFAULT '',
    "hook" TEXT NOT NULL DEFAULT '',
    "videoType" TEXT NOT NULL DEFAULT 'long',
    "scheduledTime" TEXT,
    "youtubeUrl" TEXT,
    "youtubeVideoId" TEXT,
    "uploadedAt" DATETIME,
    "uploadError" TEXT,
    "videoFileUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Video_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Video_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Video" ("adminApproved", "adminApprovedAt", "adminApprovedBy", "aiScore", "audioUrl", "channelId", "comments", "cost", "createdAt", "description", "hook", "id", "isFree", "likes", "riskLevel", "scheduledDate", "scheduledTime", "script", "status", "tags", "thumbnail", "thumbnailUrl", "title", "topic", "uploadError", "uploadedAt", "userApproved", "userApprovedAt", "userId", "videoFileUrl", "videoType", "views", "youtubeUrl", "youtubeVideoId") SELECT "adminApproved", "adminApprovedAt", "adminApprovedBy", "aiScore", "audioUrl", "channelId", "comments", "cost", "createdAt", "description", "hook", "id", "isFree", "likes", "riskLevel", "scheduledDate", "scheduledTime", "script", "status", "tags", "thumbnail", "thumbnailUrl", "title", "topic", "uploadError", "uploadedAt", "userApproved", "userApprovedAt", "userId", "videoFileUrl", "videoType", "views", "youtubeUrl", "youtubeVideoId" FROM "Video";
DROP TABLE "Video";
ALTER TABLE "new_Video" RENAME TO "Video";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
