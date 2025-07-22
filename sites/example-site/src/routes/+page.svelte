<script lang="ts">
   // This page demonstrates the SvelteKite developer experience
   // In a real project, you would:
   // 1. npm create svelte@latest my-app
   // 2. npm install @sveltekite/sveltekite
   // 3. npm install -D @sveltekite/generator
   // 4. Create schema.yaml
   // 5. npm run generate (or npx sveltekite-generate schema.yaml)
   // 6. npm run dev

   let generationStatus = 'ready' // 'ready' | 'generating' | 'success' | 'error'
   let errorMessage = ''

   function showInstructions() {
      alert(`To generate code from the schema.yaml file, run:

npm run generate

Or directly:
npx sveltekite-generate schema.yaml

This will generate all the necessary files and you can then explore the generated routes.`)
   }
</script>

<h1>Welcome to SvelteKite!</h1>

<p>This example site demonstrates the SvelteKite developer experience.</p>

<div class="workflow">
   <h2>🚀 Developer Workflow</h2>
   <ol>
      <li>✅ Create SvelteKit project</li>
      <li>✅ Install <code>@sveltekite/sveltekite</code> as dependency</li>
      <li>✅ Install <code>@sveltekite/generator</code> as dev dependency</li>
      <li>✅ Create <code>schema.yaml</code> file</li>
      <li>🔄 Run generator: <button onclick={showInstructions}>npm run generate</button></li>
      <li>🎯 Start development: <code>npm run dev</code></li>
   </ol>
</div>

<div class="generated-info">
   <h3>📁 Generated Files</h3>
   <p>The generator will create:</p>
   <ul>
      <li><code>src/lib/generated/schema.ts</code> - Zod type definitions</li>
      <li><code>src/lib/generated/tables.ts</code> - Database table configurations</li>
      <li><code>src/lib/generated/db.ts</code> - Database instance</li>
      <li><code>src/lib/generated/classes/</code> - Reactive entity classes</li>
      <li><code>src/routes/[table]/</code> - Generic CRUD routes</li>
      <li><code>src/routes/+layout.ts</code> - Database setup</li>
   </ul>
</div>
