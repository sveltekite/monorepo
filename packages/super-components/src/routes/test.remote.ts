import { query, command, form } from '$app/server'

const persons = [
   {
      name: 'Alice',
      age: 21
   },
   {
      name: "Bob",
      age: 18
   }
]

export const getPersons = query(async () => {
   return persons
})

export const getPerson = query("unchecked", async (name: string) => {
   const person = persons.find(p => p.name === name)
   return person
})

export const updatePerson = form(async ( data: FormData ) => {
   const name = data.get('name') as string
   const newAge = data.get('age') as string

   const person = persons.find(p => p.name === name)
   if (person) person.age = +newAge

   return { success: true }
})
