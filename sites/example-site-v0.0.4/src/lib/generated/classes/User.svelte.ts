import type { UserSchema } from '../schema.js'
import { BaseDB } from 'sveltekite'
import { withProps, withSave, withData, withInstance } from 'sveltekite'
import { DataSave } from 'sveltekite'
import { UserDetail } from '../components/user/UserDetail.svelte'
import { UserListItem } from '../components/user/UserListItem.svelte'

export class User extends BaseDB {
   public data = $state<UserSchema>({
      id: crypto.randomUUID(),
      name: 'new user name',
      email: 'new user email'
   })


   constructor(data?: UserSchema) {
      super()
      if (data) this.data = data

   }



   get detail() {
      return withSave(DataSave, UserDetail, { user: this }, () => this.db.put('user')(this.snapshot))
   }

   get listItem() {
      return withProps(UserListItem, { user: this })
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