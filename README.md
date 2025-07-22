# SvelteKite

SvelteKite is a tool for generating a SvelteKit app from a YAML schema.

It uses an architecture called "instance-driven architecture" that centralizes database queries in class wrappers for each table, and provides component getters which pass the relevant db queries in using helper functions. This results in super clean components that contain no database saving or loading logic, and you can reuse the same component in multiple places depending on context.


It also uses database adapters through a standardized interface so you can swap out your own database.

More thorough documentation coming soon!

Note: currently Dexie and Zod are hard dependencies.

## How to Use

1. **Initialize SvelteKit project**
   ```bash
   npx sv create your-project-name
   ```

2. **Enable Experimental Async**

   In your **svelte.config.ts** file, add the following:

   ```ts
   const config = {
      compilerOptions: {
         experimental: {
            async: true
         }
      },
      // ...rest of config
   }
   ````

3. **Install SvelteKite** (and Dexie and Zod, currently)
   ```bash
   npm install sveltekite dexie zod
   npm install --save-dev @sveltekite/generate
   ```

4. **Create schema.yaml** (in your project root directory)
   ```yaml
   # this is just an example
   # I would only use string, number, and your entity names for now
   user:
     name: string
     email: string

   post:
     title: string
     content: string
     user: user # this will put a userId field onto post
     tags: [tag] # this will create a join table. many-to-many relations MUST have a plural name

   tag:
     name: string
     color: string
   ```

5. **Generate code** (from your project's root directory)
   ```bash
   npx @sveltekite/generate schema.yaml
   ```

6. **Start development**
   ```bash
   npm run dev
   ```

## What Gets Generated

- `src/lib/generated/classes/` - Reactive entity classes
- `src/lib/generated/schema.ts` - Zod type definitions
- `src/lib/generated/tables.ts` - Database table configurations
- `src/lib/generated/data.ts` - constructors object with entity class constructors
- `src/lib/generated/db.ts` - Database instance (in future you could swap this out for different databases)
- `src/routes/[table]/[id]` - Generic CRUD routes with `+page.ts` and `+page.svelte` files
- `src/routes/+layout.ts` - Database setup

## Next Steps

In Chrome dev tools, go to Application/Storage/IndexedDB to see your database.

You can rename the database in `$lib/generated/db.ts`. It should be `app-db` initially.

Once the app is generated, you can remove `@sveltekite/generate` as a dependency.

You will still need `sveltekite`. It's only a SvelteKit library so it shouldn't have any dependencies you're not using anyway.

From here, it's up to you if you want to adhere to the instance-driven architecture or just write the app your own way.

I will write some more thorough documentation for the architecture very soon. It's very new and experimental and I most definitely have not sorted out all the issues. One big thing to mention:

- props passed through the component getters have more strict requirements for reactivity, i.e. values need to be wrapped and you should use state runes on class fields. Basically anything you declare with let probably won't be reactive. My rule of thumb is I pass the instance through the getters and then pass callbacks as extra props, which you can see in the *Detail components.

## Known Issues

- currently the generator is not writing the import statement for a class constructor that is passed into the withInstance function. This isn't really noticeable at the moment since the app isn't using that particular getter.
