import type { CategorySchema } from '../schema.js'
import { BaseDB } from 'sveltekite'
import { withProps, withSave, withData, withInstance } from 'sveltekite'
import { DataSave } from 'sveltekite'
import { CategoryDetail } from '../components/category/CategoryDetail.svelte'
import { CategoryListItem } from '../components/category/CategoryListItem.svelte'
import { PostSelect } from '../components/post/PostSelect.svelte'
import { PostList } from '../components/post/PostList.svelte'

export class Category extends BaseDB {
   public data = $state<CategorySchema>({
      id: crypto.randomUUID(),
      name: 'new category name'
   })

   _posts = $state<PostSchema[]>([])


   constructor(data?: CategorySchema) {
      super()
      if (data) this.data = data
      this.refreshPosts()

   }


   refreshposts = async () => {
      this._posts = await this.db.join('category')('post')({ categoryId: this.data.id })
   }


   addPost = (id: string) => {
      const categoryId = this.data.id
      const postId = id
      const joinRecord = { categoryId, postId }
      this.db.put('category_post')(joinRecord)
      this.refreshposts()
   }


   removePost = (id: string) => {
      const categoryId = this.data.id
      this.db.del('category_post')([categoryId, id])
      this.refreshposts()
   }


   get detail() {
      return withSave(DataSave, CategoryDetail, { category: this }, () => this.db.put('category')(this.snapshot))
   }

   get listItem() {
      return withProps(CategoryListItem, { category: this })
   }

   get posts() {
      return withProps(PostList, { posts: this._posts, remove: this.removePost }) as any
   }

   get selectPosts() {
      return withData(PostSelect, 'posts', () => this.db.all('post')) as any
   }


   get snapshot() {
      return $state.snapshot(this.data)
   }

   get db() {
      return this.getDB()
   }

   static create() {
      const category = new Category()
      return category.db.put('category')(category.snapshot)
   }
}