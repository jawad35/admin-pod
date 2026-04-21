import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  host: 'dpg-d7j1ggegvqtc739i6dcg-a.ohio-postgres.render.com',
  port: 5432,
  database: 'pos_database_7ixj',
  user: 'pos_database_7ixj_user',
  password: 'ZrTOt7yXS7Y6KXu0ktAWmyV4s4Cq6ft4',
  ssl: { rejectUnauthorized: false },
});

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Tables in live database:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    console.log(`\nTotal: ${result.rows.length} tables`);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkTables();