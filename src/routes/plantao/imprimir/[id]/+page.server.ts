import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform }) => {
    const { id } = params;

    if (!platform?.env.remocoespcce) {
        throw error(500, 'Banco de dados D1 não configurado.');
    }

    const db = platform.env.remocoespcce;

    const [plantao, equipe, procedimentos] = await Promise.all([
        db.prepare(`SELECT * FROM plantoes WHERE id = ?`).bind(id).first<{
            id: number; protocolo: string; nome_responsavel: string; matricula_responsavel: string;
            delegacia: string; data_entrada: string; hora_entrada: string;
            data_saida: string; hora_saida: string; status: string; observacoes: string;
            q_bo: number; q_guias: number; q_apreensoes: number;
            q_presos: number; q_medidas: number; q_outros: number;
            criado_em: string;
        }>(),
        db.prepare(`SELECT * FROM plantoes_equipe WHERE plantao_id = ?`).bind(id).all<{
            nome_servidor: string; matricula: string; cargo: string; classe: string;
            escala: string; data_entrada: string; hora_entrada: string;
            data_saida: string; hora_saida: string;
        }>(),
        db.prepare(`SELECT * FROM plantoes_procedimentos WHERE plantao_id = ?`).bind(id).all<{
            tipo: string; numero: string; natureza: string; envolvidos: string;
            resumo: string; vitimas_json: string; suspeitos_json: string;
        }>()
    ]);

    if (!plantao) {
        throw error(404, 'Relatório não encontrado.');
    }

    // Parse JSON dos procedimentos
    const procedimentosFormatados = (procedimentos.results ?? []).map(p => ({
        ...p,
        vitimas: p.vitimas_json ? JSON.parse(p.vitimas_json) as string[] : [],
        suspeitos: p.suspeitos_json ? JSON.parse(p.suspeitos_json) as string[] : []
    }));

    return {
        plantao,
        equipe: equipe.results ?? [],
        procedimentos: procedimentosFormatados
    };
};
