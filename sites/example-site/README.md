# SvelteKite Example Site

This site demonstrates the intended SvelteKite developer experience.

## Developer Workflow

1. **Initialize SvelteKit project**
   ```bash
   npm create svelte@latest my-app
   cd my-app
   npm install
   ```

2. **Install SvelteKite**
   ```bash
   npm install @sveltekite/sveltekite zod
   npm install -D @sveltekite/generator
   ```

3. **Create schema.yaml**
   ```yaml
   user:
     name: string
     email: email

   post:
     title: string
     content: text
     user: user
     tags: [tag]

   tag:
     name: string
     color: string
   ```

4. **Generate code**
   ```bash
   npm run generate
   # or
   npx sveltekite-generate schema.yaml
   ```

5. **Start development**
   ```bash
   npm run dev
   ```

## What Gets Generated

- `src/lib/generated/schema.ts` - Zod type definitions
- `src/lib/generated/tables.ts` - Database table configurations  
- `src/lib/generated/db.ts` - Database instance
- `src/lib/generated/classes/` - Reactive entity classes
- `src/routes/[table]/` - Generic CRUD routes
- `src/routes/+layout.ts` - Database setup

## Testing This Example

1. Build the generator: `pnpm build:generator`
2. Install dependencies: `pnpm install`
3. Generate code: `npm run generate`
4. Start dev server: `npm run dev`
5. Visit the generated routes: `/user`, `/post`, `/tag`
