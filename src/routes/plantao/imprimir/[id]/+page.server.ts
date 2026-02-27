import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform }) => {
    const { id } = params;

    if (!platform?.env.remocoespcce) {
        throw error(500, 'Banco de dados D1 não configurado.');
    }

    const db = platform.env.remocoespcce;

    try {
        // Realizamos as consultas em paralelo para máxima performance
        const [plantao, equipe, procedimentos] = await Promise.all([
            db.prepare("SELECT * FROM plantoes WHERE id = ?").bind(id).first(),
            db.prepare("SELECT * FROM plantoes_equipe WHERE plantao_id = ?").bind(id).all(),
            db.prepare("SELECT * FROM plantoes_procedimentos WHERE plantao_id = ?").bind(id).all()
        ]);

        if (!plantao) {
            throw error(404, 'Plantão não encontrado.');
        }

        return {
            plantao,
            equipe: equipe.results,
            procedimentos: procedimentos.results
        };
    } catch (err) {
        console.error('Erro ao carregar relatório:', err);
        throw error(500, 'Erro ao buscar dados no banco de dados.');
    }
};