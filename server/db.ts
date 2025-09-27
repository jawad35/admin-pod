import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Fix URL encoding issues with special characters in password
let databaseUrl = process.env.DATABASE_URL;
// If the URL contains unencoded # characters in the password, encode them
if (databaseUrl.includes('#') && !databaseUrl.includes('%23')) {
  // Parse the URL to safely encode only the password part
  const urlParts = databaseUrl.match(/^(postgresql:\/\/[^:]+:)([^@]+)(@.+)$/);
  if (urlParts) {
    const [, prefix, password, suffix] = urlParts;
    databaseUrl = prefix + encodeURIComponent(password) + suffix;
  }
}

const sql = neon(databaseUrl);
export const db = drizzle(sql);
