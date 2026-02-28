import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, locals }) => {
    const db = platform?.env.remocoespcce;
    if (!db) return {
        plantoes: [],
        estatisticas: { total: 0, rascunhos: 0, finalizados: 0 },
        quantitativos: { bo: 0, guias: 0, apreensoes: 0, presos: 0, medidas: 0, outros: 0 },
        usuario: locals.usuario
    };

    try {
        const [plantoes, stats] = await Promise.all([
            db.prepare(`
                SELECT p.id, p.protocolo, p.delegacia, p.data_entrada, p.hora_entrada,
                       p.data_saida, p.hora_saida, p.status, p.nome_responsavel,
                       p.q_bo, p.q_guias, p.q_apreensoes, p.q_presos, p.q_medidas, p.q_outros,
                       p.criado_em,
                       COUNT(DISTINCT e.id) as total_equipe,
                       COUNT(DISTINCT pr.id) as total_procedimentos
                FROM plantoes p
                LEFT JOIN plantoes_equipe e ON e.plantao_id = p.id
                LEFT JOIN plantoes_procedimentos pr ON pr.plantao_id = p.id
                GROUP BY p.id
                ORDER BY p.criado_em DESC
                LIMIT 50
            `).all<{
                id: number; protocolo: string; delegacia: string; data_entrada: string;
                hora_entrada: string; data_saida: string; hora_saida: string; status: string;
                nome_responsavel: string; q_bo: number; q_guias: number; q_apreensoes: number;
                q_presos: number; q_medidas: number; q_outros: number; criado_em: string;
                total_equipe: number; total_procedimentos: number;
            }>(),
            db.prepare(`
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'rascunho' THEN 1 ELSE 0 END) as rascunhos,
                    SUM(CASE WHEN status = 'finalizado' THEN 1 ELSE 0 END) as finalizados,
                    SUM(q_bo) as total_bo,
                    SUM(q_guias) as total_guias,
                    SUM(q_apreensoes) as total_apreensoes,
                    SUM(q_presos) as total_presos,
                    SUM(q_medidas) as total_medidas,
                    SUM(q_outros) as total_outros
                FROM plantoes
            `).first<{
                total: number; rascunhos: number; finalizados: number;
                total_bo: number; total_guias: number; total_apreensoes: number;
                total_presos: number; total_medidas: number; total_outros: number;
            }>()
        ]);

        return {
            plantoes: plantoes.results ?? [],
            estatisticas: {
                total: stats?.total ?? 0,
                rascunhos: stats?.rascunhos ?? 0,
                finalizados: stats?.finalizados ?? 0
            },
            quantitativos: {
                bo: stats?.total_bo ?? 0,
                guias: stats?.total_guias ?? 0,
                apreensoes: stats?.total_apreensoes ?? 0,
                presos: stats?.total_presos ?? 0,
                medidas: stats?.total_medidas ?? 0,
                outros: stats?.total_outros ?? 0
            },
            usuario: locals.usuario
        };
    } catch (err) {
        console.error('Erro no dashboard:', err);
        return {
            plantoes: [],
            estatisticas: { total: 0, rascunhos: 0, finalizados: 0 },
            quantitativos: { bo: 0, guias: 0, apreensoes: 0, presos: 0, medidas: 0, outros: 0 },
            usuario: locals.usuario
        };
    }
};
