# SvelteKite Library Separation

Will need to make two separate libraries; one for the generator and one for the helper files. That way users can uninstall the generator and all its dependencies once their app is generated.

## SvelteKite will contain
   - all `with*` functions
   - `DataLoad.svelte` and `DataSave.svelte`
   - `dbConfig.ts`
   - `_BaseDB.ts`
   - `DatabaseService.ts`
   - `DexieAdapter.ts`
   - Zod as dependency
   - Dexie as peer dependency

## SvelteKite generator will contain
   - all files in `bin`
   - should place files in relevant SvelteKit locations unless otherwise specified
   - Example Templates

---

Use Claude to get this working with updated code, then begin working on components.
