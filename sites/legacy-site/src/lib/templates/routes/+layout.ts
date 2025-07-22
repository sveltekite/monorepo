import { db } from '$lib/generated/db.js'
import { setDB } from '$lib/functions/dbConfig.js';

setDB(db)

export const ssr = false
