import type { TagSchema } from '../schema.js'
import { BaseDB } from '@sveltekite/sveltekite'
import { withProps, withSave, withData, withInstance } from '@sveltekite/sveltekite'
import { DataSave } from '@sveltekite/sveltekite'
import TagDetail from '../components/tag/TagDetail.svelte'
import TagListItem from '../components/tag/TagListItem.svelte'

export class Tag extends BaseDB {
   public data = $state<TagSchema>({
      id: crypto.randomUUID(),
      name: 'new tag',
      color: ''
   })

   constructor(data?: TagSchema) {
      super()
      if (data) this.data = data
   }


   get detail() {
      return withSave(DataSave, TagDetail, { tag: this }, () => this.db.put('tag')(this.snapshot))
   }

   get listItem() {
      return withProps(TagListItem, { tag: this })
   }

   get snapshot() {
      return $state.snapshot(this.data)
   }

   get db() {
      return this.getDB()
   }

   static create() {
      const tag = new Tag()
      return tag.db.put('tag')(tag.snapshot)
   }
}
