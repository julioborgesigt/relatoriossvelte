import { error } from '@sveltejs/kit';
import type { PlantaoRecord, EquipeRecord, ProcedimentoRecord, ProcedimentoFormatado } from '$lib/types';

/**
 * Queries compartilhadas para acesso a dados de plantões.
 * Centraliza padrões de consulta que se repetiam em múltiplos +page.server.ts.
 */

/** Busca um plantão por ID. Lança 404 se não encontrado. */
export async function buscarPlantao(db: D1Database, id: string | number): Promise<PlantaoRecord> {
    const plantao = await db
        .prepare(`SELECT * FROM plantoes WHERE id = ?`)
        .bind(id)
        .first<PlantaoRecord>();

    if (!plantao) {
        throw error(404, 'Relatório não encontrado.');
    }

    return plantao;
}

/** Busca todos os membros da equipe de um plantão */
export async function buscarEquipe(db: D1Database, plantaoId: string | number): Promise<EquipeRecord[]> {
    const result = await db
        .prepare(`SELECT * FROM plantoes_equipe WHERE plantao_id = ?`)
        .bind(plantaoId)
        .all<EquipeRecord>();
    return result.results ?? [];
}

/** Busca membros da equipe com escala extraordinária */
export async function buscarEquipeExtra(db: D1Database, plantaoId: string | number): Promise<EquipeRecord[]> {
    const result = await db
        .prepare(`SELECT * FROM plantoes_equipe WHERE plantao_id = ? AND escala = 'Extraordinaria'`)
        .bind(plantaoId)
        .all<EquipeRecord>();
    return result.results ?? [];
}

/** Busca procedimentos de um plantão, parseando os JSONs de vítimas e suspeitos */
export async function buscarProcedimentos(db: D1Database, plantaoId: string | number): Promise<ProcedimentoFormatado[]> {
    const result = await db
        .prepare(`SELECT * FROM plantoes_procedimentos WHERE plantao_id = ?`)
        .bind(plantaoId)
        .all<ProcedimentoRecord>();

    return (result.results ?? []).map(p => ({
        ...p,
        vitimas: p.vitimas_json ? JSON.parse(p.vitimas_json) as string[] : [],
        suspeitos: p.suspeitos_json ? JSON.parse(p.suspeitos_json) as string[] : []
    }));
}

/** Busca lista de delegacias ativas */
export async function buscarDelegacias(db: D1Database): Promise<{ nome: string }[]> {
    const result = await db
        .prepare(`SELECT nome FROM delegacias WHERE status = 'SIM' OR status = 'TEMPORARIO' ORDER BY nome`)
        .all<{ nome: string }>();
    return result.results ?? [];
}

/** Busca lista de servidores ativos */
export async function buscarServidores(db: D1Database): Promise<{ nome: string; matricula: string; cargo: string; classe: string; lotacao: string }[]> {
    const result = await db
        .prepare(`SELECT nome, matricula, cargo, classe, lotacao FROM servidores WHERE ativo = 1 ORDER BY nome`)
        .all<{ nome: string; matricula: string; cargo: string; classe: string; lotacao: string }>();
    return result.results ?? [];
}

/** 
 * Busca plantões em que o usuário participou, seja como responsável 
 * ou como membro da equipe (em qualquer função), retornando as agrupações.
 */
export async function buscarPlantoesPorUsuario(
    db: D1Database,
    matricula: string,
    limit: number,
    offset: number
): Promise<{ results: any[], total: number }> {
    // Busca os id dos plantões em que a matricula faz parte
    // Usa distinct para não duplicar se ele for responsável e equipe ao mesmo tempo
    const countQuery = await db.prepare(`
        SELECT COUNT(DISTINCT p.id) as total
        FROM plantoes p
        LEFT JOIN plantoes_equipe e ON p.id = e.plantao_id
        WHERE p.matricula_responsavel = ? OR e.matricula = ?
    `).bind(matricula, matricula).first<{ total: number }>();

    const plantoesQuery = await db.prepare(`
        SELECT p.id, p.protocolo, p.delegacia, p.data_entrada, p.hora_entrada,
               p.data_saida, p.hora_saida, p.status, p.nome_responsavel,
               p.q_bo, p.q_guias, p.q_apreensoes, p.q_presos, p.q_medidas, p.q_outros,
               p.criado_em,
               (SELECT COUNT(*) FROM plantoes_equipe WHERE plantao_id = p.id) as total_equipe,
               (SELECT COUNT(*) FROM plantoes_procedimentos WHERE plantao_id = p.id) as total_procedimentos,
               (SELECT GROUP_CONCAT(nome_servidor) FROM plantoes_equipe WHERE plantao_id = p.id) as servidores_equipe,
               (SELECT GROUP_CONCAT(tipo) FROM plantoes_procedimentos WHERE plantao_id = p.id) as tipos_procedimento
        FROM plantoes p
        WHERE p.id IN (
            SELECT DISTINCT p.id
            FROM plantoes p
            LEFT JOIN plantoes_equipe e ON p.id = e.plantao_id
            WHERE p.matricula_responsavel = ? OR e.matricula = ?
        )
        ORDER BY p.criado_em DESC
        LIMIT ? OFFSET ?
    `).bind(matricula, matricula, limit, offset).all<any>();

    return {
        results: plantoesQuery.results ?? [],
        total: countQuery?.total ?? 0
    };
}

/**
 * Retorna todos os registros da equipe_extra para a matrícula, em plantões FINALIZADOS.
 * (Apenas horas validadas).
 */
export async function buscarHorasExtrasUsuario(db: D1Database, matricula: string): Promise<any[]> {
    const result = await db.prepare(`
        SELECT e.data_entrada, e.hora_entrada, e.data_saida, e.hora_saida, e.escala, p.status
        FROM plantoes_equipe e
        JOIN plantoes p ON e.plantao_id = p.id
        WHERE e.matricula = ? 
          AND e.escala = 'Extraordinaria'
          AND (p.status = 'finalizado' OR p.status = 'retificado')
    `).bind(matricula).all<any>();
    return result.results ?? [];
}
