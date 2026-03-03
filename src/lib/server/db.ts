import { error } from '@sveltejs/kit';

/**
 * Obtém a instância do banco de dados D1 a partir do platform.
 * Centraliza o padrão repetido de verificação e acesso ao DB.
 */
export function getDb(platform: App.Platform | undefined): D1Database {
    if (!platform?.env.remocoespcce) {
        throw error(500, 'Banco de dados D1 não configurado.');
    }
    return platform.env.remocoespcce;
}
