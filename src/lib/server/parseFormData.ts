/// <reference types="@cloudflare/workers-types" />
import type { PlantaoSchemaType } from '$lib/schemas/plantao';

/**
 * Cria os prepared statements para inserir equipe e procedimentos em batch.
 */
export function criarBatchEquipeProcedimentos(
    db: D1Database,
    plantaoId: number,
    dados: PlantaoSchemaType
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const batch: any[] = [];

    if (dados.equipe) {
        for (const membro of dados.equipe) {
            batch.push(
                db.prepare(`INSERT INTO plantoes_equipe (plantao_id, nome_servidor, matricula, cargo, classe, escala, data_entrada, hora_entrada, data_saida, hora_saida) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                    .bind(
                        plantaoId,
                        membro.nome,
                        membro.matricula || null,
                        membro.cargo || null,
                        membro.lotacao || null,
                        membro.escala,
                        membro.data_entrada || null,
                        membro.hora_entrada || null,
                        membro.data_saida || null,
                        membro.hora_saida || null
                    )
            );
        }
    }

    if (dados.procedimentos) {
        for (const proc of dados.procedimentos) {
            const vitimasJson = JSON.stringify(proc.vitimas || []);
            const suspeitosJson = JSON.stringify(proc.suspeitos || []);

            batch.push(
                db.prepare(`INSERT INTO plantoes_procedimentos (plantao_id, tipo, numero, natureza, envolvidos, resumo, vitimas_json, suspeitos_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
                    .bind(
                        plantaoId,
                        proc.tipo,
                        proc.numero || null,
                        proc.natureza,
                        proc.envolvidos || null,
                        proc.resumo || null,
                        vitimasJson,
                        suspeitosJson
                    )
            );
        }
    }

    return batch;
}
