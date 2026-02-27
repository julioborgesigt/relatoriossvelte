import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// Isso garante que o Vite saiba lidar com o ambiente Cloudflare
	server: {
		fs: {
			allow: ['.']
		}
	}
});