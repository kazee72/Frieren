import { db } from "./client.js";
import type { Statement } from "better-sqlite3";

export interface AlertEntry {
  id: number;
  container_name: string;
  event_type: string;
  created_at: string;
}

let insertStmt: Statement | null = null;
let recentStmt: Statement | null = null;

function getInsertStmt(): Statement {
  if (!insertStmt) {
    insertStmt = db.prepare(`
      INSERT INTO alert (container_name, event_type, created_at)
      VALUES (?, ?, datetime('now'))
    `);
  }
  return insertStmt;
}

function getRecentStmt(): Statement {
  if (!recentStmt) {
    recentStmt = db.prepare(`
      SELECT id, container_name, event_type, created_at
      FROM alert
      ORDER BY created_at DESC
      LIMIT ?
    `);
  }
  return recentStmt;
}

export function insertAlert(params: {
  containerName: string;
  eventType: string;
}): void {
  getInsertStmt().run(params.containerName, params.eventType);
}

export function getRecentAlerts(limit = 25): AlertEntry[] {
  return getRecentStmt().all(limit) as AlertEntry[];
}