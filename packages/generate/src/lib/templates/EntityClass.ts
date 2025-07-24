__IMPORTS__

export class __CLASS_NAME__ extends BaseDB {
   public data = $state<__SCHEMA_TYPE__>(__DEFAULT_DATA__)
__RELATION_STATE_FIELDS__

   constructor(data?: __SCHEMA_TYPE__) {
      super()
      if (data) this.data = data
__CONSTRUCTOR_CALLS__
   }

__RELATION_METHODS__

__COMPONENT_GETTERS__

   get snapshot() {
      return $state.snapshot(this.data)
   }

   get db() {
      return this.getDB()
   }

   static create() {
      const __ENTITY_NAME__ = new __CLASS_NAME__()
      return __ENTITY_NAME__.db.put('__ENTITY_NAME__')(__ENTITY_NAME__.snapshot)
   }
}
