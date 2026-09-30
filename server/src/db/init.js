const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function initDB() {
  const schemaPath = path.resolve(__dirname, '../../../db/schema.sql');
  console.log(`Reading database schema from: ${schemaPath}`);

  if (!fs.existsSync(schemaPath)) {
    console.error(`Error: Schema file not found at ${schemaPath}`);
    process.exit(1);
  }

  let schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Strip UTF-8 Byte Order Mark (BOM) if present from Windows editors/PowerShell
  schemaSql = schemaSql.replace(/^\uFEFF/, '').trim();

  if (!schemaSql) {
    console.error(`Error: Schema file at ${schemaPath} is empty!`);
    process.exit(1);
  }

  try {
    console.log('Connecting to database and executing schema.sql...');
    await pool.query('DROP TABLE IF EXISTS audit_logs, audit_log, transactions, wallets, users CASCADE;');
    await pool.query(schemaSql);
    console.log('Database schema initialized successfully!');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

initDB();
