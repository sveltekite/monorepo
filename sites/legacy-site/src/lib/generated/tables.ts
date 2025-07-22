import type { EntityTable } from 'dexie'
import type { ArticleSchema, TagSchema, UserSchema, Article_tagSchema } from './schema.js'

export interface TableNames {
   article: EntityTable<ArticleSchema, 'id'>
   tag: EntityTable<TagSchema, 'id'>
   user: EntityTable<UserSchema, 'id'>
   article_tag: EntityTable<Article_tagSchema>
}

export const storesConfig = {
      article: "&id, title, body, userId",
      tag: "&id, name, color",
      user: "&id, name",
      article_tag: "&[articleId+tagId], articleId, tagId"
   }