// server/test-payment.js
import { Pool } from 'pg';

const connectionString = 'postgresql://postgres:1234@localhost:5432/postest';

const pool = new Pool({
  connectionString,
  ssl: false,
});

async function testPayment() {
    const client = await pool.connect();
    
    try {
        console.log('Testing payment functionality...\n');
        
        // Get a shop
        const shopResult = await client.query(`
            SELECT id, name, monthly_fee, total_revenue 
            FROM shops 
            LIMIT 1
        `);
        
        if (shopResult.rows.length === 0) {
            console.log('No shops found. Please create a shop first.');
            return;
        }
        
        const shop = shopResult.rows[0];
        console.log('Testing with shop:', shop.name);
        console.log('Current revenue:', shop.total_revenue);
        
        // Check if payment already exists for this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const existingPayment = await client.query(`
            SELECT * FROM payment_history 
            WHERE shop_id = $1 
            AND payment_month >= $2 
            AND payment_month <= $3
        `, [shop.id, startOfMonth, endOfMonth]);
        
        if (existingPayment.rows.length > 0) {
            console.log('Payment already exists for this month:', existingPayment.rows[0]);
        } else {
            // Create a test payment
            const amount = parseFloat(shop.monthly_fee);
            const receiptNumber = `TEST-${Date.now()}`;
            
            const paymentResult = await client.query(`
                INSERT INTO payment_history (
                    shop_id, amount, payment_month, payment_date, 
                    payment_method, status, receipt_number, collected_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [
                shop.id,
                amount,
                startOfMonth,
                new Date(),
                'cash',
                'paid',
                receiptNumber,
                'test_user'
            ]);
            
            console.log('✅ Payment created successfully:', paymentResult.rows[0]);
            
            // Update shop revenue
            const newRevenue = parseFloat(shop.total_revenue || '0') + amount;
            await client.query(`
                UPDATE shops 
                SET total_revenue = $1, updated_at = NOW()
                WHERE id = $2
            `, [newRevenue.toString(), shop.id]);
            
            console.log('✅ Shop revenue updated from', shop.total_revenue, 'to', newRevenue);
        }
        
        // Verify payment history
        const payments = await client.query(`
            SELECT id, amount, payment_month, payment_method, status, receipt_number, created_at
            FROM payment_history 
            WHERE shop_id = $1
            ORDER BY payment_month DESC
        `, [shop.id]);
        
        console.log(`\n📋 Payment history for ${shop.name}:`);
        payments.rows.forEach(payment => {
            console.log(`   - ${payment.payment_month.toLocaleDateString()}: PKR ${payment.amount} (${payment.status})`);
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

testPayment();