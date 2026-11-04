-- D1 schema. Apply with: npx wrangler d1 execute portfolio --file schema.sql [--remote]
CREATE TABLE IF NOT EXISTS counters (name TEXT PRIMARY KEY, n INTEGER NOT NULL);
INSERT OR IGNORE INTO counters VALUES ('visits', 0);
CREATE TABLE IF NOT EXISTS hits (key TEXT NOT NULL, at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS hits_key ON hits (key, at);
CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, at INTEGER NOT NULL, body TEXT NOT NULL);
