import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'node18', // Target Node.js instead of browser
    lib: {
      entry: 'src/index.ts',
      name: 'SvelteKiteGenerator',
      fileName: 'index',
      formats: ['es', 'cjs'] // Support both ES modules and CommonJS
    },
    rollupOptions: {
      external: [
        'js-yaml', 
        'fs', 
        'path', 
        'fs/promises',
        'url', // Add the url module
        'util',
        'os'
      ],
      output: {
        globals: {
          'js-yaml': 'jsyaml'
        }
      }
    }
  }
})
