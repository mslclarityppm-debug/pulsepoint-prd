// Cliente Drizzle singleton (evita múltiples conexiones en hot-reload).
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

// Ruta del archivo SQLite (relativa a la raíz del proyecto Next.js).
const dbPath = path.join(process.cwd(), "data", "los8.db");

// Garantizar que el directorio exista.
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const globalForDb = globalThis as unknown as {
  sqlite?: Database.Database;
};

const sqlite = globalForDb.sqlite ?? new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
export { schema };
export { sqlite };
