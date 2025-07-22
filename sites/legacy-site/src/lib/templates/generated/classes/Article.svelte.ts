import type { ArticleSchema, TagSchema } from '$lib/templates/generated/data.js'
import { BaseDB } from '$lib/classes/BaseDB.js'
import { withProps } from '$lib/functions/withProps.js'
import { withSave } from '$lib/functions/withSave.js'
import { withData } from '$lib/functions/withData.js'
import { withInstance } from '$lib/functions/withInstance.js'
import DataSave from '$lib/components/DataSave.svelte'
// import ArticleDetail from '$lib/components/article/ArticleDetail.svelte'
// import ArticleListItem from '$lib/components/article/ArticleListItem.svelte'
// import ArticleView from '$lib/components/article/ArticleView.svelte'
// import TagList from '$lib/components/tag/TagList.svelte'
// import TagSelect from '$lib/components/tag/TagSelect.svelte'
// import UserBadge from '$lib/components/user/UserBadge.svelte'
// import UserSelect from '$lib/components/user/UserSelect.svelte'

export class Article extends BaseDB {
   public data = $state<ArticleSchema>({
      id: crypto.randomUUID(),
      title: 'untitled',
      body: '',
      date: new Date().toISOString(),
      userId: ''
   })
   _tags = $state<TagSchema[]>([])

   constructor(data?: ArticleSchema) {
      super()
      if (data) this.data = data
      this.refreshTags()
   }

   refreshTags = () => {
      return this.db.join('article')('tag')({ articleId: this.data.id })
         .then((res: TagSchema[]) => this._tags = res)
   }

   updateUser = (id: string) => {
      this.data.userId = id
   }

   addTag = (id: string) => {
      const articleId = this.data.id
      const tagId = id
      const articleTag = { articleId, tagId }
      this.db.put('article_tag')(articleTag)
      this.refreshTags()
   }

   removeTag = (tagId: string) => {
      const articleId = this.data.id
      this.db.del('article_tag')([articleId, tagId])
      this.refreshTags()
   }

   // using as any suppresses error in article.detail
   get snapshot() { return $state.snapshot(this.data) }
   // get detail() { return withSave(DataSave, ArticleDetail, { article: this }, () => this.db.put('article')(this.snapshot)) }
   // get view() { return withProps(ArticleView, { article: this }) }
   // get listItem() { return withProps(ArticleListItem, { article: this }) }
   // get tags() { return withProps(TagList, { tags: this._tags, remove: this.removeTag }) as any }
   // get selectUser() { return withData(UserSelect, 'users', () => this.db.all('user')) as any }
   // get selectTags() { return withData(TagSelect, 'tags', () => this.db.all('tag')) as any }
   // get author() { return withInstance(UserBadge, 'user', () => this.db.get('user')(this.data.userId)) }

   get db() {
      return this.getDB()
   }

   static create() {
      const article = new Article()
      return article.db.put('article')(article.snapshot)
   }
}
