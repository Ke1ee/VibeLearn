import Database from 'better-sqlite3'
import { join } from 'path'
import { mkdirSync } from 'fs'

export type StoredEvent = {
  id: number
  received_at: string
  event_type: string
  session_id: string | null
  payload: string
}

export type EventStore = {
  insertEvent: (input: {
    event_type: string
    session_id: string | null
    payload: unknown
  }) => StoredEvent
  recentEvents: (limit: number) => StoredEvent[]
  clearAll: () => number
  recentSessions: (limit: number) => string[]
  close: () => void
}

export function openEventStore(userDataDir: string): EventStore {
  mkdirSync(userDataDir, { recursive: true })
  const dbPath = join(userDataDir, 'events.sqlite')
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      received_at TEXT NOT NULL,
      event_type TEXT NOT NULL,
      session_id TEXT,
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_events_session_received
      ON events (session_id, received_at);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events (event_type);
  `)

  const insertStmt = db.prepare(
    `INSERT INTO events (received_at, event_type, session_id, payload)
     VALUES (@received_at, @event_type, @session_id, @payload)`
  )
  const selectByIdStmt = db.prepare(`SELECT * FROM events WHERE id = ?`)
  const recentStmt = db.prepare(
    `SELECT * FROM events ORDER BY id DESC LIMIT ?`
  )
  const clearStmt = db.prepare(`DELETE FROM events`)
  // Sessions with most recent activity first. Excludes null session ids.
  const sessionsStmt = db.prepare(
    `SELECT session_id FROM events
     WHERE session_id IS NOT NULL
     GROUP BY session_id
     ORDER BY MAX(id) DESC
     LIMIT ?`
  )

  return {
    insertEvent: ({ event_type, session_id, payload }) => {
      const received_at = new Date().toISOString()
      const result = insertStmt.run({
        received_at,
        event_type,
        session_id,
        payload: JSON.stringify(payload)
      })
      return selectByIdStmt.get(result.lastInsertRowid) as StoredEvent
    },
    recentEvents: (limit) => recentStmt.all(limit) as StoredEvent[],
    clearAll: () => clearStmt.run().changes,
    recentSessions: (limit) =>
      (sessionsStmt.all(limit) as { session_id: string }[]).map((row) => row.session_id),
    close: () => db.close()
  }
}
