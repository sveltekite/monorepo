// src/lib/remote/db.remote.ts
import { command, query } from '$app/server'
import { getDB } from '../db.js'

// ============== TYPES ==============

export type User = {
  id: string
  name: string
  email: string
  created_at: string
}

export type Post = {
  id: string
  title: string
  content: string
  userId: string
  created_at: string
}

export type Tag = {
  id: string
  name: string
  color: string
}

export type PostTag = {
  postId: string
  tagId: string
}

// ============== HELPER FUNCTIONS ==============

function resultToObjects(result: any): any[] {
  if (!result.length || !result[0].values) return []

  const columns = result[0].columns
  return result[0].values.map((row: any[]) => {
    const obj: any = {}
    columns.forEach((col: string, index: number) => {
      obj[col] = row[index]
    })
    return obj
  })
}

function resultToObject(result: any): any | null {
  const objects = resultToObjects(result)
  return objects.length > 0 ? objects[0] : null
}

// ============== USER OPERATIONS ==============

export const getUsers = query(async () => {
  const db = await getDB()
  const result = db.exec('SELECT * FROM users ORDER BY created_at DESC')
  return resultToObjects(result) as User[]
})

export const getUser = query("unchecked", async (id: string) => {
  const db = await getDB()
  const result = db.exec('SELECT * FROM users WHERE id = ?', [id])
  return resultToObject(result) as User | null
})

export const createUser = command("unchecked", async (userData: Omit<User, 'id' | 'created_at'>) => {
  const db = await getDB()
  const id = crypto.randomUUID()

  db.run(
    'INSERT INTO users (id, name, email) VALUES (?, ?, ?)',
    [id, userData.name, userData.email]
  )

  return { id }
})

export const updateUser = command("unchecked", async (arg: { id: string, data: Partial<Omit<User, 'id' | 'created_at'>> }) => {
  const db = await getDB()
  const { id, data } = arg

  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ')
  const values = [...Object.values(data), id]

  db.run(`UPDATE users SET ${fields} WHERE id = ?`, values)
  return { success: true }
})

export const deleteUser = command("unchecked", async (id: string) => {
  const db = await getDB()
  db.run('DELETE FROM users WHERE id = ?', [id])
  return { success: true }
})

// ============== POST OPERATIONS ==============

export const getPosts = query(async () => {
  const db = await getDB()
  const result = db.exec('SELECT * FROM posts ORDER BY created_at DESC')
  return resultToObjects(result) as Post[]
})

export const getPost = query("unchecked", async (id: string) => {
  const db = await getDB()
  const result = db.exec('SELECT * FROM posts WHERE id = ?', [id])
  return resultToObject(result) as Post | null
})

export const getPostsByUser = query("unchecked", async (userId: string) => {
  const db = await getDB()
  const result = db.exec('SELECT * FROM posts WHERE userId = ? ORDER BY created_at DESC', [userId])
  return resultToObjects(result) as Post[]
})

export const createPost = command("unchecked", async (postData: Omit<Post, 'id' | 'created_at'>) => {
  const db = await getDB()
  const id = crypto.randomUUID()

  db.run(
    'INSERT INTO posts (id, title, content, userId) VALUES (?, ?, ?, ?)',
    [id, postData.title, postData.content, postData.userId]
  )

  return { id }
})

export const updatePost = command("unchecked", async (arg: { id: string, data: Partial<Omit<Post, 'id' | 'created_at'>> }) => {
  const db = await getDB()
  const { id, data } = arg

  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ')
  const values = [...Object.values(data), id]

  db.run(`UPDATE posts SET ${fields} WHERE id = ?`, values)
  return { success: true }
})

export const deletePost = command("unchecked", async (id: string) => {
  const db = await getDB()
  // Also delete related post_tags
  db.run('DELETE FROM post_tags WHERE postId = ?', [id])
  db.run('DELETE FROM posts WHERE id = ?', [id])
  return { success: true }
})

// ============== TAG OPERATIONS ==============

export const getTags = query(async () => {
  const db = await getDB()
  const result = db.exec('SELECT * FROM tags ORDER BY name')
  return resultToObjects(result) as Tag[]
})

export const getTag = query("unchecked", async (id: string) => {
  const db = await getDB()
  const result = db.exec('SELECT * FROM tags WHERE id = ?', [id])
  return resultToObject(result) as Tag | null
})

export const createTag = command("unchecked", async (tagData: Omit<Tag, 'id'>) => {
  const db = await getDB()
  const id = crypto.randomUUID()

  db.run(
    'INSERT INTO tags (id, name, color) VALUES (?, ?, ?)',
    [id, tagData.name, tagData.color]
  )

  return { id }
})

export const updateTag = command("unchecked", async (arg: { id: string, data: Partial<Omit<Tag, 'id'>> }) => {
  const db = await getDB()
  const { id, data } = arg

  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ')
  const values = [...Object.values(data), id]

  db.run(`UPDATE tags SET ${fields} WHERE id = ?`, values)
  return { success: true }
})

export const deleteTag = command("unchecked", async (id: string) => {
  const db = await getDB()
  // Also delete related post_tags
  db.run('DELETE FROM post_tags WHERE tagId = ?', [id])
  db.run('DELETE FROM tags WHERE id = ?', [id])
  return { success: true }
})

// ============== MANY-TO-MANY OPERATIONS (Post-Tag relationships) ==============

export const getPostTags = query("unchecked", async (postId: string) => {
  const db = await getDB()
  const result = db.exec(`
    SELECT t.* FROM tags t
    JOIN post_tags pt ON t.id = pt.tagId
    WHERE pt.postId = ?
  `, [postId])
  return resultToObjects(result) as Tag[]
})

export const getTagPosts = query("unchecked", async (tagId: string) => {
  const db = await getDB()
  const result = db.exec(`
    SELECT p.* FROM posts p
    JOIN post_tags pt ON p.id = pt.postId
    WHERE pt.tagId = ?
    ORDER BY p.created_at DESC
  `, [tagId])
  return resultToObjects(result) as Post[]
})

export const addTagToPost = command("unchecked", async (arg: { postId: string, tagId: string }) => {
  const db = await getDB()
  db.run(
    'INSERT OR IGNORE INTO post_tags (postId, tagId) VALUES (?, ?)',
    [arg.postId, arg.tagId]
  )
  return { success: true }
})

export const removeTagFromPost = command("unchecked", async (arg: { postId: string, tagId: string }) => {
  const db = await getDB()
  db.run(
    'DELETE FROM post_tags WHERE postId = ? AND tagId = ?',
    [arg.postId, arg.tagId]
  )
  return { success: true }
})

// ============== UTILITY/SEARCH OPERATIONS ==============

export const searchPosts = query("unchecked", async (searchTerm: string) => {
  const db = await getDB()
  const term = `%${searchTerm}%`
  const result = db.exec(`
    SELECT * FROM posts
    WHERE title LIKE ? OR content LIKE ?
    ORDER BY created_at DESC
  `, [term, term])
  return resultToObjects(result) as Post[]
})

export const searchTags = query("unchecked", async (searchTerm: string) => {
  const db = await getDB()
  const term = `%${searchTerm}%`
  const result = db.exec('SELECT * FROM tags WHERE name LIKE ? ORDER BY name', [term])
  return resultToObjects(result) as Tag[]
})

export const getPostsWithTags = query(async () => {
  const db = await getDB()
  const result = db.exec(`
    SELECT
      p.*,
      GROUP_CONCAT(t.name) as tag_names,
      GROUP_CONCAT(t.color) as tag_colors
    FROM posts p
    LEFT JOIN post_tags pt ON p.id = pt.postId
    LEFT JOIN tags t ON pt.tagId = t.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `)
  return resultToObjects(result)
})

// ============== STATS/ANALYTICS ==============

export const getDashboardStats = query(async () => {
  const db = await getDB()

  const userCountResult = db.exec('SELECT COUNT(*) as count FROM users')
  const postCountResult = db.exec('SELECT COUNT(*) as count FROM posts')
  const tagCountResult = db.exec('SELECT COUNT(*) as count FROM tags')

  return {
    users: userCountResult[0]?.values[0]?.[0] || 0,
    posts: postCountResult[0]?.values[0]?.[0] || 0,
    tags: tagCountResult[0]?.values[0]?.[0] || 0
  }
})

export const getUserPostCounts = query(async () => {
  const db = await getDB()
  const result = db.exec(`
    SELECT
      u.id,
      u.name,
      u.email,
      COUNT(p.id) as post_count
    FROM users u
    LEFT JOIN posts p ON u.id = p.userId
    GROUP BY u.id, u.name, u.email
    ORDER BY post_count DESC
  `)
  return resultToObjects(result)
})

export const getTagUsageCounts = query(async () => {
  const db = await getDB()
  const result = db.exec(`
    SELECT
      t.id,
      t.name,
      t.color,
      COUNT(pt.postId) as usage_count
    FROM tags t
    LEFT JOIN post_tags pt ON t.id = pt.tagId
    GROUP BY t.id, t.name, t.color
    ORDER BY usage_count DESC
  `)
  return resultToObjects(result)
})
