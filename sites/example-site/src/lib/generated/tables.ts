import type { EntityTable } from 'dexie'
import type { UserSchema, PostSchema, TagSchema, Post_tagSchema } from './schema.js'

export interface TableNames {
   user: EntityTable<UserSchema, 'id'>
   post: EntityTable<PostSchema, 'id'>
   tag: EntityTable<TagSchema, 'id'>
   post_tag: EntityTable<Post_tagSchema>
}

export const storesConfig = {
      user: "&id, name, email",
      post: "&id, title, content, userId",
      tag: "&id, name, color",
      post_tag: "&[postId+tagId], postId, tagId"
   }