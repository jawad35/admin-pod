import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import "dotenv/config"; // loads .env automatically

const isRemote = !!process.env.DATABASE_URL;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:yourpassword@localhost:5432/yourdbname",
  ssl: isRemote
    ? { rejectUnauthorized: false } // Supabase / Heroku / Neon
    : false,                        // local dev, no SSL
});

export const db = drizzle(pool);
