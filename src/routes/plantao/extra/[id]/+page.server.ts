import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform, url }) => {
    const { id } = params;

    if (!platform?.env.remocoespcce) {
        throw error(500, 'Banco de dados D1 não configurado.');
    }

    const db = platform.env.remocoespcce;

    const [plantao, equipe] = await Promise.all([
        db.prepare(`SELECT * FROM plantoes WHERE id = ?`).bind(id).first<{
            id: number; protocolo: string; nome_responsavel: string;
            delegacia: string; data_entrada: string; hora_entrada: string;
            data_saida: string; hora_saida: string;
        }>(),
        db.prepare(`SELECT * FROM plantoes_equipe WHERE plantao_id = ? AND escala = 'Extraordinaria'`).bind(id).all<{
            nome_servidor: string; matricula: string; cargo: string; classe: string;
            data_entrada: string; hora_entrada: string; data_saida: string; hora_saida: string;
        }>()
    ]);

    if (!plantao) {
        throw error(404, 'Plantão não encontrado.');
    }

    return {
        plantao,
        equipeExtra: equipe.results ?? [],
        config: {
            dir: url.searchParams.get('dir') ?? '',
            just: url.searchParams.get('just') ?? '',
            mb: url.searchParams.get('mb') ?? ''
        }
    };
};
