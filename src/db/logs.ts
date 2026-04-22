import { db } from "./client.js";

export interface LogEntry {
  id: number;
  discord_user_id: string;
  content: string;
  source: "slash" | "dm" | "git";
  created_at: string;
}

const insertStmt = db.prepare(`
  INSERT INTO log_entry (discord_user_id, content, source, created_at)
  VALUES (?, ?, ?, datetime('now'))
`);

const selectInRangeStmt = db.prepare(`
  SELECT id, discord_user_id, content, source, created_at
  FROM log_entry
  WHERE discord_user_id = ?
    AND created_at >= ?
    AND created_at < ?
  ORDER BY created_at ASC
`);

export function insertLog(params: {
  userId: string;
  content: string;
  source: "slash" | "dm" | "git";
}): void {
  insertStmt.run(params.userId, params.content, params.source);
}

export function getLogsInRange(params: {
  userId: string;
  fromIso: string;
  toIso: string;
}): LogEntry[] {
  return selectInRangeStmt.all(
    params.userId,
    params.fromIso,
    params.toIso
  ) as LogEntry[];
}
