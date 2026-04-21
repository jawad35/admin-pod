import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  host: 'dpg-d7j1ggegvqtc739i6dcg-a.ohio-postgres.render.com',
  port: 5432,
  database: 'pos_database_7ixj',
  user: 'pos_database_7ixj_user',
  password: 'ZrTOt7yXS7Y6KXu0ktAWmyV4s4Cq6ft4',
  ssl: {
    rejectUnauthorized: false,  // Required for Render
  },
  connectionTimeoutMillis: 10000,
});

const db = drizzle(pool);

async function resetLiveDatabase() {
  console.log('🔄 Resetting LIVE Render database...');
  
  try {
    // Test connection first
    await pool.query('SELECT 1');
    console.log('✅ Connected to database successfully');
    
    // Drop all tables
    const tables = [
      'audit_logs', 'referrals', 'maintenance', 'complaints', 'expenses',
      'subscriptions', 'payment_history', 'user_subscriptions', 'subscription_plans',
      'shops', 'employees', 'licenses', 'users', 'sessions'
    ];
    
    for (const table of tables) {
      try {
        await db.execute(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✅ Dropped ${table}`);
      } catch (err) {
        console.log(`⚠️ Could not drop ${table}: ${err.message}`);
      }
    }
    
    // Drop enum types
    const enums = ['plan_type', 'shop_type', 'subscription_status', 'complaint_status', 'maintenance_status'];
    
    for (const enumType of enums) {
      try {
        await db.execute(`DROP TYPE IF EXISTS ${enumType} CASCADE`);
        console.log(`✅ Dropped enum ${enumType}`);
      } catch (err) {
        console.log(`⚠️ Could not drop enum ${enumType}: ${err.message}`);
      }
    }
    
    console.log('🎉 LIVE Database reset successfully!');
    console.log('Now run: npm run db:push');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

resetLiveDatabase();