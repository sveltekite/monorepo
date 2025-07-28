// src/lib/remote/db-test.remote.ts
import { command, query } from '$app/server'
import { getDB } from '../db.js'

export type TableInfo = {
  name: string
  count: number
  columns: Array<{ name: string; type: string; pk: number }>
}

export type TestUser = {
  id: string
  name: string
  email: string
  created_at: string
}

// Get database status and table information
export const getDatabaseInfo = query(async () => {
  try {
    const db = await getDB()

    // Get all tables (excluding SQLite system tables)
    const tablesQuery = `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
    const tablesResult = db.exec(tablesQuery)

    const tables: TableInfo[] = []

    if (tablesResult.length > 0 && tablesResult[0].values) {
      for (const row of tablesResult[0].values) {
        const tableName = row[0] as string

        // Get row count
        const countResult = db.exec(`SELECT COUNT(*) as count FROM ${tableName}`)
        const count = countResult[0]?.values[0]?.[0] as number || 0

        // Get column info
        const columnsResult = db.exec(`PRAGMA table_info(${tableName})`)
        const columns = columnsResult[0]?.values?.map(col => ({
          name: col[1] as string,
          type: col[2] as string,
          pk: col[5] as number
        })) || []

        tables.push({
          name: tableName,
          count,
          columns
        })
      }
    }

    return {
      success: true,
      tables,
      message: 'Database connection successful'
    }

  } catch (error) {
    console.error('Database info error:', error)
    throw new Error(`Database error: ${error.message}`)
  }
})

// Create a test user to verify write operations
export const createTestUser = command(async () => {
  try {
    const db = await getDB()
    const userId = crypto.randomUUID()
    const userName = `Test User ${Date.now()}`
    const userEmail = `test${Date.now()}@example.com`

    // Insert the user
    db.run(`INSERT INTO users (id, name, email) VALUES (?, ?, ?)`, [userId, userName, userEmail])

    return {
      success: true,
      userId,
      message: 'Test user created successfully'
    }

  } catch (error) {
    console.error('Create test user error:', error)
    throw new Error(`Failed to create test user: ${error.message}`)
  }
})

// Get a specific user by ID to verify read operations
export const getTestUser = query("unchecked", async (userId: string) => {
  try {
    const db = await getDB()
    const result = db.exec(`SELECT * FROM users WHERE id = ?`, [userId])

    let user = null
    if (result.length > 0 && result[0].values && result[0].values.length > 0) {
      const columns = result[0].columns
      const values = result[0].values[0]

      // Convert array of values to object using column names
      user = {}
      columns.forEach((col, index) => {
        user[col] = values[index]
      })
    }

    return {
      success: true,
      user,
      found: !!user
    }

  } catch (error) {
    console.error('Get test user error:', error)
    throw new Error(`Failed to get test user: ${error.message}`)
  }
})

// Clean up test users (optional)
export const cleanupTestUsers = command(async () => {
  try {
    const db = await getDB()

    // First get count of test users
    const countResult = db.exec(`SELECT COUNT(*) FROM users WHERE name LIKE 'Test User %'`)
    const count = countResult[0]?.values[0]?.[0] as number || 0

    // Delete test users
    db.run(`DELETE FROM users WHERE name LIKE 'Test User %'`)

    return {
      success: true,
      deletedCount: count,
      message: `Cleaned up ${count} test users`
    }

  } catch (error) {
    console.error('Cleanup test users error:', error)
    throw new Error(`Failed to cleanup test users: ${error.message}`)
  }
})
