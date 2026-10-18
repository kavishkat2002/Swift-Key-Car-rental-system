import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine database path
const dbPath = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : path.resolve(__dirname, '../../swiftdrive.db');

export const db = new Database(dbPath);

// Enable foreign keys and WAL mode
db.pragma('foreign_keys = ON');
if (process.env.NODE_ENV !== 'test') {
  db.pragma('journal_mode = WAL');
}

export function initializeDatabase(): void {
  const schemaPath = path.resolve(__dirname, './schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
}

// Initial schema setup on load
initializeDatabase();

export default db;
