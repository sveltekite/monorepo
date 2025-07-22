import { setDB } from 'sveltekite'
import { db } from '$lib/generated/db.js'

setDB(db)

export const ssr = false
