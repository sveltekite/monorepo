// GENERATED FILE - DO NOT EDIT
import type { EntityTable } from 'dexie'
import type { ArticleSchema, TagSchema, UserSchema, ArticleTagSchema } from './schema.js'

export interface TableNames {
   article: EntityTable<ArticleSchema, 'id'>
   tag: EntityTable<TagSchema, 'id'>
   user: EntityTable<UserSchema, 'id'>
   article_tag: EntityTable<ArticleTagSchema>
}

export const tableDefinitions = {
   article: {} as EntityTable<ArticleSchema, 'id'>,
   tag: {} as EntityTable<TagSchema, 'id'>,
   user: {} as EntityTable<UserSchema, 'id'>,
   article_tag: {} as EntityTable<ArticleTagSchema>
}

export const storesConfig = {
   article: "&id, title, date, userId",
   tag: "&id, name",
   user: "&id, name",
   article_tag: "&[articleId+tagId], articleId, tagId"
}
