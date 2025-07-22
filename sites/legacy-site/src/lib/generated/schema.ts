import { z } from 'zod'

const articleSchema = z.object({
   id: z.uuid(),
   title: z.string().min(1).max(255),
   body: z.string(),
   userId: z.uuid()
})

export type ArticleSchema = z.infer<typeof articleSchema>

const tagSchema = z.object({
   id: z.uuid(),
   name: z.string().min(1).max(255),
   color: z.string().min(1).max(255)
})

export type TagSchema = z.infer<typeof tagSchema>

const userSchema = z.object({
   id: z.uuid(),
   name: z.string().min(1).max(255)
})

export type UserSchema = z.infer<typeof userSchema>

const article_tagSchema = z.object({
   articleId: z.uuid(),
   tagId: z.uuid()
})

export type Article_tagSchema = z.infer<typeof article_tagSchema>