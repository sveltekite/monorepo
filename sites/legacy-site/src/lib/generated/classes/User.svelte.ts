import type { UserSchema } from '../schema.js'
import { BaseDB } from '$lib/classes/BaseDB.js'
import { withSave } from '$lib/functions/withSave.js'
import { withProps } from '$lib/functions/withProps.js'
import DataSave from '$lib/components/DataSave.svelte'
import UserDetail from '../components/UserDetail.svelte'
import UserListItem from '../components/UserListItem.svelte'

export class User extends BaseDB {
   public data = $state<UserSchema>({
      id: crypto.randomUUID(),
      name: 'new user'
   })

   constructor(data?: UserSchema) {
      super()
      if (data) this.data = data
   }

   get listItem() {
      return withProps(UserListItem, { user: this })
   }

   get detail() {
      return withSave(DataSave, UserDetail, { user: this }, () => this.db.put('user')(this.snapshot))
   }

   get snapshot() {
      return $state.snapshot(this.data)
   }

   get db() {
      return this.getDB()
   }

   static create() {
      const user = new User()
      return user.db.put('user')(user.snapshot)
   }
}
