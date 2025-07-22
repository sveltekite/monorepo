import Dexie from 'dexie'
import type { DatabaseService } from '$lib/db/DatabaseService.js'

export class DexieAdapter extends Dexie.default implements DatabaseService {
   constructor(dbName: string, stores: Record<string, string>) {
      super(dbName)
      this.version(1).stores(stores)
   }

   all = (tableName: string) => {
      const table = (this as any)[tableName]
      if (!table) return
      return table.toArray()
   }

   filter = (tableName: string) => (param: Record<string, any>) => {
      const table = (this as any)[tableName]
      if (!table) return
      return table.where(param).toArray()
   }

   // partially apply source and target tables and join them with underscore
   join = (sourceTableName: string) => (targetTableName: string) => async (param: Record<string, any>) => {
      const joinTableName1 = sourceTableName + '_' + targetTableName
      const joinTableName2 = targetTableName + '_' + sourceTableName
      const joinTable = (this as any)[joinTableName1] ?? (this as any)[joinTableName2]
      const targetTable = (this as any)[targetTableName]
      if (!joinTable || !targetTable) return console.warn("Table doesn't exist")
      const [key, value] = Object.entries(param)[0]
      const joinRecords = await joinTable.where(key).equals(value).toArray()
      const targetIdField = targetTableName + 'Id'
      const targetIds = joinRecords.map((record: any) => record[targetIdField])
      const targetRecords = await targetTable.where('id').anyOf(targetIds).toArray()
      return targetRecords
   }

   add = (tableName: string) => (item: any, key?: any) => {
      const table = (this as any)[tableName]
      if (!table) return
      return table.add(item, key)
   }

   get = (tableName: string) => (param: any) => {
      if (!param) return undefined
      const table = (this as any)[tableName]
      if (!table || !param) return new Error('An error occurred')
      return table.get(param)
   }

   put = (tableName: string) => (item: any, key?: any) => {
      const table = (this as any)[tableName]
      if (!table) return
      return table.put(item, key)
   }

   del = (tableName: string) => (key: any) => {
      const table = (this as any)[tableName]
      if (!table) return
      return table.delete(key)
   }
}
