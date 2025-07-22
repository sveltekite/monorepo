import type { TagSchema } from "$lib/templates/generated/data.js";
import { BaseDB } from '$lib/classes/BaseDB.js'
import { withData } from '$lib/functions/withData.js'
import { withProps } from '$lib/functions/withProps.js'
import { withSave } from '$lib/functions/withSave.js'
import DataSave from "$lib/components/DataSave.svelte";
// import TagBadge from "$lib/components/tag/TagBadge.svelte";
// import TagDetail from "$lib/components/tag/TagDetail.svelte"
// import ArticleList from '$lib/components/article/ArticleList.svelte'

export class Tag extends BaseDB {
   public data = $state<TagSchema>({
      id: crypto.randomUUID(),
      name: 'untitled tag',
      color: 'white'
   })

   constructor(data?: TagSchema) {
      super()
      if (data) this.data = data
   }

   get snapshot() {
      return $state.snapshot(this.data)
   }

   // get listItem() {
   //    return withProps(TagBadge, { tag: this })
   // }

   // get detail() {
   //    return withSave(DataSave, TagDetail, { tag: this }, () => this.db.put('tag')(this.snapshot))
   // }

   // get articles() {
   //    return withData(ArticleList, 'articles', () => this.db.join('tag')('article')({ tagId: this.data.id })) as any
   // }

   get db() {
      return this.getDB()
   }

   static create() {
      const tag = new Tag()
      return tag.db.put('tag')(tag.snapshot)
   }
}
