import pg from "pg";

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_o3aFUuZS0tWh@ep-raspy-frost-aotk0fzy-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// Use a single client pool
export const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS trips_store (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } catch (err) {
    console.error("Error initializing database:", err);
  } finally {
    client.release();
  }
}

export async function getState() {
  try {
    const res = await pool.query("SELECT value FROM trips_store WHERE key = 'app_state'");
    if (res.rows.length > 0) {
      return res.rows[0].value;
    }
    return null;
  } catch (err) {
    console.error("Error getting state from database:", err);
    return null;
  }
}

export async function saveState(state: any) {
  try {
    await pool.query(
      `INSERT INTO trips_store (key, value, updated_at) 
       VALUES ('app_state', $1, NOW()) 
       ON CONFLICT (key) 
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [JSON.stringify(state)]
    );
    return true;
  } catch (err) {
    console.error("Error saving state to database:", err);
    return false;
  }
}
