import { db } from "./client.js";

export function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS log_entry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discord_user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      source TEXT NOT NULL CHECK (source IN ('slash', 'dm', 'git')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_log_entry_user_date
    ON log_entry (discord_user_id, created_at)
  `);

  console.log("Database migration completed.");
}
