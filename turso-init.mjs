import { createClient } from "@libsql/client";

const client = createClient({
  url: "libsql://youtubeauto-db-adityahub404singh.aws-ap-south-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQyMzcyMDgsImlkIjoiMDE5ZjZjZDItYmIwMS03MDkyLTg5YzItNWRiYjYwNjg2YmU3Iiwia2lkIjoieEx5dk42dDBENFFBM3FWTzJRWTVXSFJ4MUc1QUFZcXk3Y1ZJMnh1VjU1byIsInJpZCI6IjQ3ZDQwNjMwLTJhYmMtNDRjMy1hZTAyLTk2NTYyYWEwMTc5ZiJ9.-k_U3nkgdqdcX-BjI-48DCL8qqUEJbMLeR6fLRJ-B_cQmEUAid6jh7ZzjMtraG58WZ77PKaQBWkKwEjaq5VuCA"
});

const tables = [
`CREATE TABLE IF NOT EXISTS User (id TEXT NOT NULL PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT "", role TEXT NOT NULL DEFAULT "user", plan TEXT NOT NULL DEFAULT "free", hasCompletedSetup INTEGER NOT NULL DEFAULT 0, freeVideosUsed INTEGER NOT NULL DEFAULT 0, paidVideoCredits INTEGER NOT NULL DEFAULT 0, totalSpent REAL NOT NULL DEFAULT 0, youtubeMonetized INTEGER NOT NULL DEFAULT 0, youtubeEarnings REAL NOT NULL DEFAULT 0, youtubeShareOwed REAL NOT NULL DEFAULT 0, lastActive DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
`CREATE UNIQUE INDEX IF NOT EXISTS User_email_key ON User(email)`,
`CREATE TABLE IF NOT EXISTS Channel (id TEXT NOT NULL PRIMARY KEY, userId TEXT NOT NULL, name TEXT NOT NULL, subscribers INTEGER NOT NULL DEFAULT 0, category TEXT NOT NULL DEFAULT "tech", language TEXT NOT NULL DEFAULT "hi", voice TEXT NOT NULL DEFAULT "hi-IN-Wavenet-B", defaultTags TEXT NOT NULL DEFAULT "", privacy TEXT NOT NULL DEFAULT "public", uploadTime TEXT NOT NULL DEFAULT "10:00", contentStrategy TEXT NOT NULL DEFAULT "", isActive INTEGER NOT NULL DEFAULT 1, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (userId) REFERENCES User(id))`,
`CREATE TABLE IF NOT EXISTS Video (id TEXT NOT NULL PRIMARY KEY, channelId TEXT NOT NULL, userId TEXT NOT NULL, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT "pending-approval", riskLevel TEXT NOT NULL DEFAULT "low", scheduledDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, views INTEGER NOT NULL DEFAULT 0, likes INTEGER NOT NULL DEFAULT 0, comments INTEGER NOT NULL DEFAULT 0, retentionRate REAL NOT NULL DEFAULT 0, thumbnail TEXT NOT NULL DEFAULT "", topic TEXT NOT NULL, subCategory TEXT NOT NULL DEFAULT "general", description TEXT NOT NULL DEFAULT "", tags TEXT NOT NULL DEFAULT "[]", aiScore INTEGER NOT NULL DEFAULT 75, adminApproved INTEGER NOT NULL DEFAULT 0, adminApprovedBy TEXT, adminApprovedAt DATETIME, userApproved INTEGER NOT NULL DEFAULT 0, userApprovedAt DATETIME, cost REAL NOT NULL DEFAULT 0, isFree INTEGER NOT NULL DEFAULT 1, audioUrl TEXT NOT NULL DEFAULT "", thumbnailUrl TEXT NOT NULL DEFAULT "", script TEXT NOT NULL DEFAULT "", hook TEXT NOT NULL DEFAULT "", videoType TEXT NOT NULL DEFAULT "long", scheduledTime TEXT, youtubeUrl TEXT, youtubeVideoId TEXT, uploadedAt DATETIME, uploadError TEXT, videoFileUrl TEXT, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (channelId) REFERENCES Channel(id), FOREIGN KEY (userId) REFERENCES User(id))`,
`CREATE TABLE IF NOT EXISTS Payment (id TEXT NOT NULL PRIMARY KEY, userId TEXT NOT NULL, type TEXT NOT NULL, amount REAL NOT NULL, videoId TEXT, status TEXT NOT NULL DEFAULT "pending", createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (userId) REFERENCES User(id))`,
`CREATE TABLE IF NOT EXISTS ConceptHistory (id TEXT NOT NULL PRIMARY KEY, userId TEXT NOT NULL, category TEXT NOT NULL, subCategory TEXT NOT NULL, topic TEXT NOT NULL, hook TEXT NOT NULL, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`
];

for (const sql of tables) {
  try {
    await client.execute(sql);
    console.log("OK:", sql.slice(13, 50));
  } catch(e) {
    console.log("SKIP:", e.message.slice(0, 80));
  }
}
console.log("Turso DB ready!");
