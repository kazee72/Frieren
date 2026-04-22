import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, mkdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, "..", "..", "data");
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, "bot.db");

export const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma("journal_mode = WAL");

// Enable foreign key constraints
db.pragma("foreign_keys = ON");
