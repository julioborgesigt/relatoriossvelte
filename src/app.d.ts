declare global {
	namespace App {
		interface Platform {
			env: {
				// Use exatamente o nome do seu binding aqui
				remocoespcce: D1Database; 
			};
			context: ExecutionContext;
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};