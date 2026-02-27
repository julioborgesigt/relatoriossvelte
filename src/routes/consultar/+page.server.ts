import type { PageServerLoad } from './$types';

// Ao usar PageServerLoad, o TS entende que 'platform' vem do App.Platform que definimos
export const load: PageServerLoad = async ({ platform }) => {
    
    // O uso do '?' após platform é importante para evitar erros se ele estiver indefinido localmente
    const { results } = await platform?.env.remocoespcce.prepare(
        "SELECT * FROM remocoes ORDER BY data_solicitacao DESC"
    ).all();

    return {
        remocoes: results || []
    };
};