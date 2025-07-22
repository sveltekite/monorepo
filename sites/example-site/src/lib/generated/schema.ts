import { z } from 'zod'

const userSchema = z.object({
   id: z.uuid(),
   name: z.string().min(1).max(255),
   email: z.string()
})

export type UserSchema = z.infer<typeof userSchema>

const postSchema = z.object({
   id: z.uuid(),
   title: z.string().min(1).max(255),
   content: z.string(),
   userId: z.uuid()
})

export type PostSchema = z.infer<typeof postSchema>

const tagSchema = z.object({
   id: z.uuid(),
   name: z.string().min(1).max(255),
   color: z.string().min(1).max(255)
})

export type TagSchema = z.infer<typeof tagSchema>

const post_tagSchema = z.object({
   postId: z.uuid(),
   tagId: z.uuid()
})

export type Post_tagSchema = z.infer<typeof post_tagSchema>