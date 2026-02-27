import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		// O adapter-cloudflare não precisa de configurações extras
		// para funcionar na maioria dos casos básicos.
		adapter: adapter()
	}
};

export default config;