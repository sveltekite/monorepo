// src/lib/db.ts
import initSqlJs from 'sql.js'
import { dev } from '$app/environment'
import fs from 'fs'

let SQL: any = null
let db: any = null

export async function getDB() {
  if (!db) {
    // Initialize sql.js
    if (!SQL) {
      SQL = await initSqlJs()
    }

    const dbPath = dev ? 'data/app.db' : '/tmp/app.db'

    // Try to load existing database file
    let dbData = null
    try {
      if (fs.existsSync(dbPath)) {
        dbData = fs.readFileSync(dbPath)
      }
    } catch (err) {
      console.log('No existing database found, creating new one')
    }

    // Create database (from file or new)
    db = new SQL.Database(dbData)

    // Initialize tables if new database
    if (!dbData) {
      initializeTables()
    }

    // Save database to file after any changes
    setupAutoSave(dbPath)
  }
  return db
}

function initializeTables() {
  if (!db) return

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      userId TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#000000'
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS post_tags (
      postId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      PRIMARY KEY (postId, tagId),
      FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
    )
  `)
}

function setupAutoSave(dbPath: string) {
  // Save database to file periodically
  const saveInterval = setInterval(() => {
    saveDatabase(dbPath)
  }, 5000) // Save every 5 seconds

  // Also save on process exit
  process.on('exit', () => {
    clearInterval(saveInterval)
    saveDatabase(dbPath)
  })

  process.on('SIGINT', () => {
    saveDatabase(dbPath)
    process.exit(0)
  })
}

function saveDatabase(dbPath: string) {
  if (!db) return

  try {
    // Ensure directory exists
    const dir = dbPath.substring(0, dbPath.lastIndexOf('/'))
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Export database and save to file
    const data = db.export()
    fs.writeFileSync(dbPath, Buffer.from(data))
  } catch (err) {
    console.error('Failed to save database:', err)
  }
}

// Helper functions for common operations
export async function createRecord(table: string, data: Record<string, any>) {
  const db = await getDB()
  const fields = Object.keys(data).join(', ')
  const placeholders = Object.keys(data).map(() => '?').join(', ')
  const values = Object.values(data)

  const stmt = db.prepare(`INSERT INTO ${table} (${fields}) VALUES (${placeholders})`)
  stmt.run(values)
  return data.id
}

export async function updateRecord(table: string, id: string, data: Record<string, any>) {
  const db = await getDB()
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ')
  const values = [...Object.values(data), id]

  const stmt = db.prepare(`UPDATE ${table} SET ${fields} WHERE id = ?`)
  stmt.run(values)
}

export async function deleteRecord(table: string, id: string) {
  const db = await getDB()
  const stmt = db.prepare(`DELETE FROM ${table} WHERE id = ?`)
  stmt.run([id])
}

export async function findAll(table: string) {
  const db = await getDB()
  const stmt = db.prepare(`SELECT * FROM ${table} ORDER BY created_at DESC`)
  const results = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  return results
}

export async function findById(table: string, id: string) {
  const db = await getDB()
  const stmt = db.prepare(`SELECT * FROM ${table} WHERE id = ?`)
  stmt.bind([id])
  if (stmt.step()) {
    return stmt.getAsObject()
  }
  return null
}

export async function findByField(table: string, field: string, value: any) {
  const db = await getDB()
  const stmt = db.prepare(`SELECT * FROM ${table} WHERE ${field} = ?`)
  stmt.bind([value])
  const results = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  return results
}
