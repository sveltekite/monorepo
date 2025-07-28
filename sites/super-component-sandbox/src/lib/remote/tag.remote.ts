import { command, query } from '$app/server'
import { error } from '@sveltejs/kit';

const randomiseValue = () => (Math.random()*10000).toFixed(0)

function* thingGenerator(): Generator<any, Thing> {
   let id = 1;
   while(true) {
      yield {
         id: (id++).toString(),
         value: randomiseValue()
      }
   }
}

const generateThing = thingGenerator()

type Thing = {
   id: string,
   value: string
}

const initialTags: Thing[] = [
   { id: "99999", value: "Gutentag" },
   generateThing.next().value,
   generateThing.next().value
]

let tags = [ ...initialTags ]

export const getTags = query(async () => {
   // return error(500, "Tag Test error")
   return tags
})

export const getPostTags = query("unchecked", async (postId: string) => {

})

export const getTag = query("unchecked", async (tagId: string) => {
   const tag = tags.find(el => el.id === tagId)
   return tag
})

export const resetTags = command(async () => {
   tags = [ ...initialTags ]
})

export const addTag = command(async () => {
   tags.push(generateThing.next().value)
})

export const editTag = command("unchecked", async (arg: { tagId: string, newValue: string }) => {
   const tag = tags.find(el => el.id === arg.tagId)
   if (tag) tag.value = arg.newValue
})

export const getMessage = query(async () => {
   return "Hello there"
})
