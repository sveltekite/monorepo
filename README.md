# SvelteKite

SvelteKite is a tool for generating a SvelteKit app from a YAML schema.

It uses an architecture called "instance-driven architecture" that centralizes database queries in class wrappers for each table, and makes use of Svelte's reactivity to provide contextual queries through helper functions. This results in super clean components that contain no database saving or loading logic.

It also uses database adapters through a standardized interface so you can swap out your own database.

## Developer Experience

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
   npx sveltekite-generate schema.yaml
   ```

5. **Start development**
   ```bash
   npm run dev
   ```

## Monorepo Structure

- **`apps/generator`** - Core TypeScript code generator
- **`packages/sveltekite`** - SvelteKit package with base classes and utilities  
- **`sites/example-site`** - Demo site showing generator usage
- **`sites/legacy-site`** - Legacy implementation (for reference only)

## Quick Start

```bash
# Install dependencies
pnpm install

# Build the generator package
pnpm build:generator

# Build the sveltekite package
pnpm build:package

# Run the example site
pnpm dev:example
```

## Usage

1. Create a `schema.yaml` file defining your entities
2. Use the `@sveltekite/generator` to generate code
3. Import from `@sveltekite/sveltekite` for base classes

See the example site for a complete demonstration.
