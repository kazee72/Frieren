import { db } from "./client.js";

export function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS alert (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_name TEXT NOT NULL,
      event_type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_alert_created
    ON alert (created_at)
  `);

  console.log("Database migration completed.");
}