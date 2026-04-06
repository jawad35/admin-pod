import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = 'postgresql://postgres:1234@localhost:5432/postest';

const pool = new Pool({
  connectionString,
  ssl: false, // ✅ local DB → NO SSL
});

export const db = drizzle(pool);