import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		experimental: {
			async: true
		}
	},

	kit: {
		adapter: adapter(),
		experimental: { remoteFunctions: true }
	}
};

export default config;
