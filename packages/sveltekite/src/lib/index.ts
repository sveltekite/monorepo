export { default as DataLoad } from '$lib/components/DataLoad.svelte'
export { default as DataSave } from '$lib/components/DataSave.svelte'

export { type DatabaseService } from '$lib/db/DatabaseService.js'
export { DexieAdapter } from '$lib/db/adapters/Dexie.js'
export { BaseDB } from '$lib/db/BaseDB.js'

export { withInstance } from '$lib/functions/withInstance.js'
export { withProps } from '$lib/functions/withProps.js'
export { withData } from '$lib/functions/withData.js'
export { withSave } from '$lib/functions/withSave.js'

export { getDB, setDB } from '$lib/functions/dbConfig.js'
