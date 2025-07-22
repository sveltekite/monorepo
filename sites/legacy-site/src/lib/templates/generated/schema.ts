// GENERATED FILE - DO NOT EDIT
import { z } from 'zod'

const articleSchema = z.object({
   id: z.uuid(),
   title: z.string().min(1).max(64),
   body: z.string(),
   date: z.string(),
   userId: z.string()
})

const tagSchema = z.object({
   id: z.uuid(),
   name: z.string().min(1).max(16),
   color: z.string()
})

const userSchema = z.object({
   id: z.uuid(),
   name: z.string().min(1).max(32)
})

const articleTagSchema = z.object({
   articleId: z.uuid(),
   tagId: z.uuid()
})

export type ArticleSchema = z.infer<typeof articleSchema>
export type TagSchema = z.infer<typeof tagSchema>
export type UserSchema = z.infer<typeof userSchema>
export type ArticleTagSchema = z.infer<typeof articleTagSchema>
