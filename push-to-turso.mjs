import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

const envContent = readFileSync(".env.local", "utf8");
const env = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim();
});

console.log("DATABASE_URL found:", !!env.DATABASE_URL);
console.log("TURSO_AUTH_TOKEN found:", !!env.TURSO_AUTH_TOKEN);

const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

const sql = readFileSync("migration.sql", "utf8");

try {
  await client.executeMultiple(sql);
  console.log("Migration applied successfully to Turso!");
} catch (e) {
  console.error("Migration failed:", e.message);
}
