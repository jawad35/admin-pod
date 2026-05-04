import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";

const connectionString = 'postgresql://pos_database_7ixj_user:ZrTOt7yXS7Y6KXu0ktAWmyV4s4Cq6ft4@dpg-d7j1ggegvqtc739i6dcg-a.ohio-postgres.render.com/pos_database_7ixj';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool);

async function addMachineColumns() {
  console.log('Adding machine info columns...');
  
  await db.execute(sql`
    ALTER TABLE licenses 
    ADD COLUMN IF NOT EXISTS computer_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS mac_address VARCHAR(255),
    ADD COLUMN IF NOT EXISTS os_platform VARCHAR(100),
    ADD COLUMN IF NOT EXISTS os_release VARCHAR(100);
  `);
  
  console.log('✅ Machine columns added');
  await pool.end();
}

addMachineColumns();