declare global {
	namespace App {
		interface Locals {
			usuario: {
				matricula: string;
				nome: string;
				email: string;
				lotacao: string | null;
				cargo: string | null;
			} | null;
		}
		interface Platform {
			env: {
				remocoespcce: D1Database;
				// Variável opcional para envio de email (Resend)
				RESEND_API_KEY?: string;
			};
			context: ExecutionContext;
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
