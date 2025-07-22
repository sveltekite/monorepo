import type { ArticleSchema, TagSchema, UserSchema } from '../schema.js'
import { BaseDB } from '$lib/classes/BaseDB.js'
import { withProps } from '$lib/functions/withProps.js'
import { withSave } from '$lib/functions/withSave.js'
import { withData } from '$lib/functions/withData.js'
import { withInstance } from '$lib/functions/withInstance.js'
import DataSave from '$lib/components/DataSave.svelte'
import ArticleDetail from '$lib/generated/components/ArticleDetail.svelte'
import ArticleListItem from '$lib/generated/components/ArticleListItem.svelte'
import UserSelect from '$lib/generated/components/UserSelect.svelte'
import UserListItem from '$lib/generated/components/UserListItem.svelte'
import TagSelect from '$lib/generated/components/TagSelect.svelte'
import TagList from '../components/TagList.svelte'

export class Article extends BaseDB {
   public data = $state<ArticleSchema>({
      id: crypto.randomUUID(),
      title: 'new article',
      body: '',
      userId: ''
   })

   _tags = $state<TagSchema[]>([])
   user = $derived(this.db.get('user')(this.data.userId))

   constructor(data?: ArticleSchema) {
      super()
      if (data) this.data = data
      this.refreshTags()
   }

   getUser() {
      return this.db?.get('user')(this.data.userId)
   }

   updateUser = (id: string) => {
      this.data.userId = id
   }

   refreshTags = () => {
      return this.db.join('article')('tag')({ articleId: this.data.id })
         .then((res: TagSchema[]) => this._tags = res)
   }

   addTag = (id: string) => {
      const articleId = this.data.id
      const tagId = id
      const joinRecord = { articleId, tagId }
      this.db.put('article_tag')(joinRecord).then(() => this.refreshTags())
   }

   removeTag = (tagId: string) => {
      const articleId = this.data.id
      this.db.del('article_tag')([articleId, tagId]).then(() => this.refreshTags())
   }

   get detail() {
      return withSave(DataSave, ArticleDetail, { article: this }, () => this.db.put('article')(this.snapshot))
   }

   get listItem() { return withProps(ArticleListItem, { article: this }) }
   get selectUser() { return withData(UserSelect, 'users', () => this.db.all('user')) as any }
   get author() { return withInstance(UserListItem, 'user', () => this.db.get('user')(this.data.userId)) as any}
   get tags() { return withProps(TagList, { tags: this._tags, remove: this.removeTag }) as any }
   get selectTags() { return withData(TagSelect, 'tags', () => this.db.all('tag')) as any }

   get snapshot() {
      return $state.snapshot(this.data)
   }

   get db() {
      return this.getDB()
   }

   static create() {
      const article = new Article()
      return article.db.put('article')(article.snapshot)
   }
}
