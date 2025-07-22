import type { TagSchema } from '../schema.js'
import { BaseDB } from '$lib/classes/BaseDB.js'
import { withSave } from '$lib/functions/withSave.js'
import { withProps } from '$lib/functions/withProps.js'
import TagDetail from '../components/TagDetail.svelte'
import TagListItem from '../components/TagListItem.svelte'
import DataSave from '$lib/components/DataSave.svelte'

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

   get listItem() {
      return withProps(TagListItem, { tag: this })
   }

   get detail() {
      return withSave(DataSave, TagDetail, { tag: this }, () => this.db.put('tag')(this.snapshot))
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
