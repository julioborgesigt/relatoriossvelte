import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { isAdmin } from '$lib/server/auth';

export const load: PageServerLoad = async ({ platform, locals }) => {
    const db = platform?.env.remocoespcce;
    const usuario = locals.usuario;

    if (!isAdmin(usuario)) {
        throw redirect(302, '/plantao');
    }

    if (!db) {
        return {
            extras: [],
            usuario
        };
    }

    try {
        const query = `
            SELECT 
                e.nome_servidor as nome, 
                e.matricula, 
                e.cargo, 
                p.delegacia as unidade,
                e.data_entrada, 
                e.hora_entrada,
                e.data_saida, 
                e.hora_saida,
                p.protocolo,
                p.id as plantao_id
            FROM plantoes_equipe e
            JOIN plantoes p ON e.plantao_id = p.id
            WHERE e.escala = 'Extraordinaria' 
              AND p.status = 'finalizado'
            ORDER BY e.data_entrada DESC, e.hora_entrada DESC
        `;

        const result = await db.prepare(query).all();

        return {
            extras: result.results ?? [],
            usuario,
            pageTitle: 'Horas Extras — DPI SUL',
            pageHeading: 'Estatísticas',
            pageSubheading: 'Controle de Plantões Extraordinários'
        };
    } catch (err) {
        console.error('Erro ao buscar extras:', err);
        return {
            extras: [],
            usuario
        };
    }
};
