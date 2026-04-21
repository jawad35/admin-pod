import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// For production (Render)
const connectionString = 'postgresql://pos_database_7ixj_user:ZrTOt7yXS7Y6KXu0ktAWmyV4s4Cq6ft4@dpg-d7j1ggegvqtc739i6dcg-a.ohio-postgres.render.com/pos_database_7ixj';

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for Render
  },
});

export const db = drizzle(pool);