import Database from 'better-sqlite3'
import { config } from '../config'
import { logger } from '../logger'
import { runMigrations } from './migrations'

let instance: Database.Database | null = null

export function getDb(): Database.Database {
  if (instance) return instance
  const db = new Database(config.dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('foreign_keys = ON')
  db.pragma('temp_store = MEMORY')
  runMigrations(db)
  instance = db
  logger.info({ db: config.dbPath }, '数据库已就绪')
  return instance
}

export function closeDb(): void {
  if (!instance) return
  instance.close()
  instance = null
}

export function transaction<T>(fn: () => T): T {
  const db = getDb()
  return db.transaction(fn)()
}

export type Db = Database.Database
export type { Database }
