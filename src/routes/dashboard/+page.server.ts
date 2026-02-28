import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, locals }) => {
    const db = platform?.env.remocoespcce;
    if (!db) return {
        plantoes: [],
        delegacias: [],
        estatisticas: { total: 0, rascunhos: 0, finalizados: 0, retificados: 0 },
        quantitativos: { bo: 0, guias: 0, apreensoes: 0, presos: 0, medidas: 0, outros: 0 },
        usuario: locals.usuario
    };

    try {
        const [plantoes, stats, delegacias] = await Promise.all([
            db.prepare(`
                SELECT p.id, p.protocolo, p.delegacia, p.data_entrada, p.hora_entrada,
                       p.data_saida, p.hora_saida, p.status, p.nome_responsavel,
                       p.q_bo, p.q_guias, p.q_apreensoes, p.q_presos, p.q_medidas, p.q_outros,
                       p.criado_em,
                       COUNT(DISTINCT e.id) as total_equipe,
                       COUNT(DISTINCT pr.id) as total_procedimentos,
                       GROUP_CONCAT(DISTINCT e.nome_servidor) as servidores_equipe,
                       GROUP_CONCAT(DISTINCT pr.tipo) as tipos_procedimento
                FROM plantoes p
                LEFT JOIN plantoes_equipe e ON e.plantao_id = p.id
                LEFT JOIN plantoes_procedimentos pr ON pr.plantao_id = p.id
                GROUP BY p.id
                ORDER BY p.criado_em DESC
                LIMIT 200
            `).all<{
                id: number; protocolo: string; delegacia: string; data_entrada: string;
                hora_entrada: string; data_saida: string; hora_saida: string; status: string;
                nome_responsavel: string; q_bo: number; q_guias: number; q_apreensoes: number;
                q_presos: number; q_medidas: number; q_outros: number; criado_em: string;
                total_equipe: number; total_procedimentos: number;
                servidores_equipe: string | null; tipos_procedimento: string | null;
            }>(),
            db.prepare(`
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'rascunho' THEN 1 ELSE 0 END) as rascunhos,
                    SUM(CASE WHEN status = 'finalizado' THEN 1 ELSE 0 END) as finalizados,
                    SUM(CASE WHEN status = 'retificado' THEN 1 ELSE 0 END) as retificados,
                    SUM(CASE WHEN status != 'rascunho' THEN q_bo ELSE 0 END) as total_bo,
                    SUM(CASE WHEN status != 'rascunho' THEN q_guias ELSE 0 END) as total_guias,
                    SUM(CASE WHEN status != 'rascunho' THEN q_apreensoes ELSE 0 END) as total_apreensoes,
                    SUM(CASE WHEN status != 'rascunho' THEN q_presos ELSE 0 END) as total_presos,
                    SUM(CASE WHEN status != 'rascunho' THEN q_medidas ELSE 0 END) as total_medidas,
                    SUM(CASE WHEN status != 'rascunho' THEN q_outros ELSE 0 END) as total_outros
                FROM plantoes
            `).first<{
                total: number; rascunhos: number; finalizados: number; retificados: number;
                total_bo: number; total_guias: number; total_apreensoes: number;
                total_presos: number; total_medidas: number; total_outros: number;
            }>(),
            db.prepare(`
                SELECT DISTINCT delegacia FROM plantoes
                WHERE delegacia IS NOT NULL AND delegacia != ''
                ORDER BY delegacia
            `).all<{ delegacia: string }>()
        ]);

        return {
            plantoes: plantoes.results ?? [],
            delegacias: delegacias.results?.map(d => d.delegacia) ?? [],
            estatisticas: {
                total: stats?.total ?? 0,
                rascunhos: stats?.rascunhos ?? 0,
                finalizados: stats?.finalizados ?? 0,
                retificados: stats?.retificados ?? 0
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
            delegacias: [],
            estatisticas: { total: 0, rascunhos: 0, finalizados: 0, retificados: 0 },
            quantitativos: { bo: 0, guias: 0, apreensoes: 0, presos: 0, medidas: 0, outros: 0 },
            usuario: locals.usuario
        };
    }
};
