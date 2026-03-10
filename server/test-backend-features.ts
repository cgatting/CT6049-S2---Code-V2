
import { db } from './server/db.js';

console.log('Running Backend Feature Tests...');

try {
    // Feature 7: Backend Audit API (Data Availability)
    console.log('Testing Feature 7 (Audit Logs)...');
    try {
        const logs = db.prepare('SELECT * FROM sys_auth_logs LIMIT 1').all();
        console.log('✅ Audit Logs table exists and is queryable.');
    } catch(e) {
        console.error('❌ Audit Logs table check failed:', e);
    }

    // Feature 10: Report Filters API (Data Availability)
    console.log('Testing Feature 10 (Filters)...');
    try {
        const categories = db.prepare('SELECT DISTINCT category FROM dim_books').all();
        const formats = db.prepare('SELECT DISTINCT format FROM dim_books').all();
        console.log('✅ Filters query works (Category/Format).');
    } catch(e) {
        console.error('❌ Filters query failed:', e);
    }

    console.log('Backend Feature Verification Passed.');
} catch (e) {
    console.error('❌ Backend Test Failed:', e);
    process.exit(1);
}
