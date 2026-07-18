import { createClient } from "@libsql/client";
import { createHash } from "crypto";

const client = createClient({
  url: "libsql://youtubeauto-db-adityahub404singh.aws-ap-south-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQyMzcyMDgsImlkIjoiMDE5ZjZjZDItYmIwMS03MDkyLTg5YzItNWRiYjYwNjg2YmU3Iiwia2lkIjoieEx5dk42dDBENFFBM3FWTzJRWTVXSFJ4MUc1QUFZcXk3Y1ZJMnh1VjU1byIsInJpZCI6IjQ3ZDQwNjMwLTJhYmMtNDRjMy1hZTAyLTk2NTYyYWEwMTc5ZiJ9.-k_U3nkgdqdcX-BjI-48DCL8qqUEJbMLeR6fLRJ-B_cQmEUAid6jh7ZzjMtraG58WZ77PKaQBWkKwEjaq5VuCA"
});

// Check what columns exist
const result = await client.execute("SELECT * FROM User WHERE email='singhaditya4560@gmail.com'");
console.log("User data:", JSON.stringify(result.rows[0], null, 2));
console.log("Columns:", result.columns);
