import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const client = createClient({
  url: "libsql://youtubeauto-db-adityahub404singh.aws-ap-south-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQyMzcyMDgsImlkIjoiMDE5ZjZjZDItYmIwMS03MDkyLTg5YzItNWRiYjYwNjg2YmU3Iiwia2lkIjoieEx5dk42dDBENFFBM3FWTzJRWTVXSFJ4MUc1QUFZcXk3Y1ZJMnh1VjU1byIsInJpZCI6IjQ3ZDQwNjMwLTJhYmMtNDRjMy1hZTAyLTk2NTYyYWEwMTc5ZiJ9.-k_U3nkgdqdcX-BjI-48DCL8qqUEJbMLeR6fLRJ-B_cQmEUAid6jh7ZzjMtraG58WZ77PKaQBWkKwEjaq5VuCA"
});

const r = await client.execute({ sql: "SELECT email, password FROM User WHERE email=?", args: ["singhaditya4560@gmail.com"] });
const u = r.rows[0];
console.log("User found:", !!u);
console.log("Password hash:", u?.password ? String(u.password).slice(0,20) + "..." : "NULL");

const testPwd = "Aditya123#";
if (u?.password) {
  const valid = await bcrypt.compare(testPwd, String(u.password));
  console.log("Password 'Aditya123#' valid:", valid);
}
