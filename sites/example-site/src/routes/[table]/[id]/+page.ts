import type { PageLoad } from "./$types.js";
import { db } from '$lib/generated/db.js'
import { constructors } from "$lib/generated/data.js";
import type { TableNames } from "$lib/generated/tables.js";

type ValidTableName = keyof typeof constructors;

function isValidTableName(tableName: string): tableName is ValidTableName {
   return tableName in constructors;
}

function tableExistsInDb(tableName: string): tableName is keyof TableNames {
   return db.tables.some(table => table.name === tableName);
}

export const load: PageLoad = async ({ params }) => {
   const tableName = params.table;

   if (tableExistsInDb(tableName) && isValidTableName(tableName)) {
      const data = await db.get(params.table as keyof TableNames)(params.id)

      const Constructor = constructors[tableName];

      return {
         // @ts-ignore
         [tableName]: new Constructor(data)
      };
   } else {
      return {};
   }
}
