# SvelteKite Example Site

This site demonstrates the intended SvelteKite developer experience.

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

3. **Install SvelteKite**
   ```bash
   npm install sveltekite dexie zod
   npm install -D @sveltekite/generate
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
     content: string # in theory this would be a longer string, but I think they're the same
     user: user # this will put a userId field onto post
     tags: [tag] # many-to-many MUST have a plural name

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
- `src/routes/[table]/` - Generic CRUD routes
- `src/routes/+layout.ts` - Database setup

## Testing This Example

1. Build the generator: `pnpm build:generator`
2. Install dependencies: `pnpm install`
3. Generate code: `npm run generate`
4. Start dev server: `npm run dev`
5. Visit the generated routes: `/user`, `/post`, `/tag`
