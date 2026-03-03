import type { Usuario } from '$lib/types';

declare global {
	namespace App {
		interface Locals {
			usuario: Usuario | null;
		}
		interface Platform {
			env: {
				remocoespcce: D1Database;
				RESEND_API_KEY?: string;
			};
			context: ExecutionContext;
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
