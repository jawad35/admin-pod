import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = 'postgresql://pos_system_oehj_user:GlM4As656wmZZqKdndchJfB28AS0ZRe7@dpg-d7j0vj8sfn5c73ee266g-a.ohio-postgres.render.com/pos_system_oehj';

const pool = new Pool({
  connectionString,
  ssl: false, // ✅ local DB → NO SSL
});

export const db = drizzle(pool);