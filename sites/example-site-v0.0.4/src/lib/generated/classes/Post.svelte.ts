import type { PostSchema } from '../schema.js'
import { BaseDB } from 'sveltekite'
import { withProps, withSave, withData, withInstance } from 'sveltekite'
import { DataSave } from 'sveltekite'
import { PostDetail } from '../components/post/PostDetail.svelte'
import { PostListItem } from '../components/post/PostListItem.svelte'
import { UserSelect } from '../components/user/UserSelect.svelte'
import { UserListItem } from '../components/user/UserListItem.svelte'
import { TagSelect } from '../components/tag/TagSelect.svelte'
import { TagList } from '../components/tag/TagList.svelte'

export class Post extends BaseDB {
   public data = $state<PostSchema>({
      id: crypto.randomUUID(),
      title: 'new post title',
      content: 'new post content',
      userId: ''
   })

   _tags = $state<TagSchema[]>([])


   constructor(data?: PostSchema) {
      super()
      if (data) this.data = data
      this.refreshTags()

   }


   refreshtags = async () => {
      this._tags = await this.db.join('post')('tag')({ postId: this.data.id })
   }


   addTag = (id: string) => {
      const postId = this.data.id
      const tagId = id
      const joinRecord = { postId, tagId }
      this.db.put('post_tag')(joinRecord)
      this.refreshtags()
   }


   removeTag = (id: string) => {
      const postId = this.data.id
      this.db.del('post_tag')([postId, id])
      this.refreshtags()
   }


   get detail() {
      return withSave(DataSave, PostDetail, { post: this }, () => this.db.put('post')(this.snapshot))
   }

   get listItem() {
      return withProps(PostListItem, { post: this })
   }

   get selectUser() {
      return withData(UserSelect, 'users', () => this.db.all('user')) as any
   }

   get user() {
      return withInstance(UserListItem, 'user', () => this.db.get('user')(this.data.userId), User) as any
   }

   get tags() {
      return withProps(TagList, { tags: this._tags, remove: this.removeTag }) as any
   }

   get selectTags() {
      return withData(TagSelect, 'tags', () => this.db.all('tag')) as any
   }


   get snapshot() {
      return $state.snapshot(this.data)
   }

   get db() {
      return this.getDB()
   }

   static create() {
      const post = new Post()
      return post.db.put('post')(post.snapshot)
   }
}