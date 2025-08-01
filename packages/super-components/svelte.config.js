import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
   compilerOptions: {
      experimental: {
         async: true
      }
   },
	preprocess: vitePreprocess(),
   kit: {
      adapter: adapter(),
      experimental: {
         remoteFunctions: true
      }
   },
};

export default config;
