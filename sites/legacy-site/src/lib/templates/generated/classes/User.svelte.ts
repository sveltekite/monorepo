import type { UserSchema } from "$lib/templates/generated/data.js";
import { BaseDB } from '$lib/classes/BaseDB.js'
import { withProps } from '$lib/functions/withProps.js'
import { withSave } from '$lib/functions/withSave.js'
import { withData } from '$lib/functions/withData.js'
import DataSave from "$lib/components/DataSave.svelte";
// import UserBadge from "$lib/components/user/UserBadge.svelte";
// import UserDetail from "$lib/components/user/UserDetail.svelte"
// import ArticleList from '$lib/components/article/ArticleList.svelte'

export class User extends BaseDB {
   public data = $state<UserSchema>({
      id: crypto.randomUUID(),
      name: 'untitled User'
   })

   constructor(data?: UserSchema) {
      super()
      if (data) this.data = data
   }

   get snapshot() {
      return $state.snapshot(this.data)
   }

   // get listItem() {
   //    return withProps(UserBadge, { user: this })
   // }

   // get detail() {
   //    return withSave(DataSave, UserDetail, { user: this }, () => this.db.put('user')(this.snapshot))
   // }

   // get articles() {
   //    return withData(ArticleList, 'articles', () => this.db.filter('article')({ userId: this.data.id }) ) as any
   // }

   get db() {
      return this.getDB()
   }

   static create() {
      const user = new User()
      return user.db.put('user')(user.snapshot)
   }
}
