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
