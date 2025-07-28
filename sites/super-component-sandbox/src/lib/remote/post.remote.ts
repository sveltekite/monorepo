import { query, command, form } from '$app/server'

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

const initialPosts: Thing[] = [
   { id: "10000", value: "Hello there" },
   generateThing.next().value,
   generateThing.next().value
]

let posts = [ ...initialPosts ]

export const getPosts = query(async () => {
   return posts
})

export const getPost = query("unchecked", async (postId: string) => {
   const post = posts.find(el => el.id === postId)
   return post
})

export const resetPosts = command(async () => {
   posts = [ ...initialPosts ]
})

export const addPost = command(async () => {
   posts.push(generateThing.next().value)
})

export const editPost = form(async ( data: FormData) => {
   const postId = data.get('id') as string
   const newValue = data.get('value') as string

   const post = posts.find(p => p.id === postId)
   if (post) post.value = newValue

   return { success: true }
})
