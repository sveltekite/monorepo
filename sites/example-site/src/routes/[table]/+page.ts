import type { PageLoad } from "./$types.js";
import { db } from '$lib/generated/db.js'
import { constructors } from "$lib/generated/data.js";
import type { TableNames } from "$lib/generated/tables.js";

// Type for valid table names that have constructors
type ValidTableName = keyof typeof constructors;

// Type guard to check if a string is a valid table name
function isValidTableName(tableName: string): tableName is ValidTableName {
   return tableName in constructors;
}

// Type guard to check if table exists in database
function tableExistsInDb(tableName: string): tableName is keyof TableNames {
   return db.tables.some(table => table.name === tableName);
}

export const load: PageLoad = async ({ params }) => {
   const tableName = params.table;

   // Type-safe validation
   if (tableExistsInDb(tableName) && isValidTableName(tableName)) {
      const result = await db.all(tableName) as any[];

      // Type-safe constructor access
      const Constructor = constructors[tableName];

      return {
         entries: result.map(data => new Constructor(data)),
         constructor: Constructor,
         table: params.table
      };
   } else {
      return {};
   }
}
