import { createClient } from "@libsql/client";
const client = createClient({
  url: "libsql://youtubeauto-db-adityahub404singh.aws-ap-south-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQyMzcyMDgsImlkIjoiMDE5ZjZjZDItYmIwMS03MDkyLTg5YzItNWRiYjYwNjg2YmU3Iiwia2lkIjoieEx5dk42dDBENFFBM3FWTzJRWTVXSFJ4MUc1QUFZcXk3Y1ZJMnh1VjU1byIsInJpZCI6IjQ3ZDQwNjMwLTJhYmMtNDRjMy1hZTAyLTk2NTYyYWEwMTc5ZiJ9.-k_U3nkgdqdcX-BjI-48DCL8qqUEJbMLeR6fLRJ-B_cQmEUAid6jh7ZzjMtraG58WZ77PKaQBWkKwEjaq5VuCA"
});
await client.execute("INSERT OR IGNORE INTO User (id, email, name, role, plan, hasCompletedSetup) VALUES ('admin1', 'singhaditya4560@gmail.com', 'Aditya Singh', 'admin', 'pro', 1)");
console.log("Admin user created!");
