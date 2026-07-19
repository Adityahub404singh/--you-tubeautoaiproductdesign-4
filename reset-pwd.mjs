import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const client = createClient({
  url: "libsql://youtubeauto-db-adityahub404singh.aws-ap-south-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQyMzcyMDgsImlkIjoiMDE5ZjZjZDItYmIwMS03MDkyLTg5YzItNWRiYjYwNjg2YmU3Iiwia2lkIjoieEx5dk42dDBENFFBM3FWTzJRWTVXSFJ4MUc1QUFZcXk3Y1ZJMnh1VjU1byIsInJpZCI6IjQ3ZDQwNjMwLTJhYmMtNDRjMy1hZTAyLTk2NTYyYWEwMTc5ZiJ9.-k_U3nkgdqdcX-BjI-48DCL8qqUEJbMLeR6fLRJ-B_cQmEUAid6jh7ZzjMtraG58WZ77PKaQBWkKwEjaq5VuCA"
});

const newPassword = "Admin@2026";
const hash = await bcrypt.hash(newPassword, 10);
await client.execute({ sql: "UPDATE User SET password=? WHERE email=?", args: [hash, "singhaditya4560@gmail.com"] });
console.log("Password reset to: Admin@2026");
console.log("Hash:", hash.slice(0,30) + "...");
