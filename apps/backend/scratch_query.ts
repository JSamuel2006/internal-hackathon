import { pool } from './src/database/db.js';

async function main() {
  try {
    console.log("\n=== FK Constraints on emergency_doctor_requests ===");
    const fks = await pool.query(`
      SELECT 
        tc.constraint_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='emergency_doctor_requests'
    `);
    console.log(JSON.stringify(fks.rows, null, 2));

    console.log("\n=== ALL Table FK Constraints ===");
    const allFks = await pool.query(`
      SELECT 
        tc.table_name,
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name
    `);
    console.log(JSON.stringify(allFks.rows, null, 2));

    // Try to simulate the INSERT that createRequest does
    console.log("\n=== Simulating createRequest INSERT ===");
    const testReqId = `edr-test-diag-${Date.now()}`;
    try {
      await pool.query(
        `INSERT INTO emergency_doctor_requests (id, emergency_id, citizen_user_id, doctor_id, priority, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [testReqId, 'ern-1786795663204-cmysk5', 'usr-1786793222342', 'doc-demo', 'LOW', 'REQUESTED']
      );
      console.log("INSERT succeeded!");

      // Clean up
      await pool.query("DELETE FROM emergency_doctor_requests WHERE id = $1", [testReqId]);
      console.log("Cleanup done.");
    } catch (err: any) {
      console.log("INSERT FAILED:", err.message, err.code);
    }

    process.exit(0);
  } catch (err: any) {
    console.error("ERROR:", err.message, err.code);
    process.exit(1);
  }
}

main();
