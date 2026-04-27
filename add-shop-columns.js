import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";

// For production (Render)
const connectionString = 'postgresql://pos_database_7ixj_user:ZrTOt7yXS7Y6KXu0ktAWmyV4s4Cq6ft4@dpg-d7j1ggegvqtc739i6dcg-a.ohio-postgres.render.com/pos_database_7ixj';

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for Render
  },
});

export const db = drizzle(pool);

async function addNewColumns() {
  console.log('Starting migration: Adding phone_no and terms_policies_accepted columns...');
  
  try {
    // Check if phone_no column exists and add if it doesn't
    console.log('Checking and adding phone_no column...');
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'shops' AND column_name = 'phone_no') THEN 
          ALTER TABLE shops ADD COLUMN phone_no VARCHAR(255);
          RAISE NOTICE 'Column phone_no added successfully';
        ELSE 
          RAISE NOTICE 'Column phone_no already exists';
        END IF;
      END $$;
    `);
    
    // Check if terms_policies_accepted column exists and add if it doesn't
    console.log('Checking and adding terms_policies_accepted column...');
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'shops' AND column_name = 'terms_policies_accepted') THEN 
          ALTER TABLE shops ADD COLUMN terms_policies_accepted BOOLEAN DEFAULT FALSE;
          RAISE NOTICE 'Column terms_policies_accepted added successfully with default FALSE';
        ELSE 
          RAISE NOTICE 'Column terms_policies_accepted already exists';
        END IF;
      END $$;
    `);
    
    // Set default value for existing rows
    console.log('Setting default values for existing rows...');
    await db.execute(sql`
      UPDATE shops 
      SET terms_policies_accepted = FALSE 
      WHERE terms_policies_accepted IS NULL;
    `);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - phone_no column added (default: NULL)');
    console.log('   - terms_policies_accepted column added (default: FALSE)');
    console.log('   - Updated existing rows with terms_policies_accepted = FALSE');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Close the database connection
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the migration
addNewColumns()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });