/// <reference types="@cloudflare/workers-types" />
import type { DadosFormulario, MembroEquipe, ProcedimentoQualitativo } from '$lib/types/plantao';

/**
 * Extrai e valida os dados do formulário de plantão a partir de FormData.
 * Compartilhado entre criação e retificação de plantões.
 */
export function parseFormularioPlantao(formData: FormData): DadosFormulario {
    const delegacia = formData.get('delegacia')?.toString().toUpperCase().trim() || '';
    const data_entrada = formData.get('data_entrada')?.toString() || '';
    const hora_entrada = formData.get('hora_entrada')?.toString() || '';
    const data_saida = formData.get('data_saida')?.toString() || '';
    const hora_saida = formData.get('hora_saida')?.toString() || '';
    const observacoes = formData.get('observacoes')?.toString().toUpperCase().trim() || '';

    // Quantitativos
    const q_bo = parseInt(formData.get('q_bo')?.toString() || '0') || 0;
    const q_guias = parseInt(formData.get('q_guias')?.toString() || '0') || 0;
    const q_apreensoes = parseInt(formData.get('q_apreensoes')?.toString() || '0') || 0;
    const q_presos = parseInt(formData.get('q_presos')?.toString() || '0') || 0;
    const q_medidas = parseInt(formData.get('q_medidas')?.toString() || '0') || 0;
    const q_outros = parseInt(formData.get('q_outros')?.toString() || '0') || 0;

    // Equipe
    const equipe: MembroEquipe[] = [];
    let i = 0;
    while (formData.has(`equipe_${i}_nome`)) {
        const nome = formData.get(`equipe_${i}_nome`)?.toString().toUpperCase().trim() || '';
        if (nome) {
            equipe.push({
                nome,
                matricula: formData.get(`equipe_${i}_matricula`)?.toString() || '',
                cargo: formData.get(`equipe_${i}_cargo`)?.toString() || '',
                classe: formData.get(`equipe_${i}_classe`)?.toString() || '',
                escala: formData.get(`equipe_${i}_escala`)?.toString() || 'Normal',
                data_entrada: formData.get(`equipe_${i}_data_entrada`)?.toString() || data_entrada,
                hora_entrada: formData.get(`equipe_${i}_hora_entrada`)?.toString() || hora_entrada,
                data_saida: formData.get(`equipe_${i}_data_saida`)?.toString() || data_saida,
                hora_saida: formData.get(`equipe_${i}_hora_saida`)?.toString() || hora_saida,
            });
        }
        i++;
    }

    // Procedimentos qualitativos
    const procedimentos: ProcedimentoQualitativo[] = [];
    let j = 0;
    while (formData.has(`proc_${j}_tipo`)) {
        const tipo = formData.get(`proc_${j}_tipo`)?.toString() || '';
        const natureza = formData.get(`proc_${j}_natureza`)?.toString().toUpperCase().trim() || '';
        if (tipo && natureza) {
            const vitimas: string[] = [];
            let v = 0;
            while (formData.has(`proc_${j}_vitima_${v}`)) {
                const vit = formData.get(`proc_${j}_vitima_${v}`)?.toString().toUpperCase().trim();
                if (vit) vitimas.push(vit);
                v++;
            }
            const suspeitos: string[] = [];
            let s = 0;
            while (formData.has(`proc_${j}_suspeito_${s}`)) {
                const sus = formData.get(`proc_${j}_suspeito_${s}`)?.toString().toUpperCase().trim();
                if (sus) suspeitos.push(sus);
                s++;
            }

            procedimentos.push({
                tipo,
                numero: formData.get(`proc_${j}_numero`)?.toString() || '',
                natureza,
                envolvidos: formData.get(`proc_${j}_envolvidos`)?.toString().toUpperCase().trim() || '',
                resumo: formData.get(`proc_${j}_resumo`)?.toString().toUpperCase().trim() || '',
                vitimas_json: JSON.stringify(vitimas),
                suspeitos_json: JSON.stringify(suspeitos)
            });
        }
        j++;
    }

    return {
        delegacia,
        data_entrada,
        hora_entrada,
        data_saida,
        hora_saida,
        observacoes,
        q_bo,
        q_guias,
        q_apreensoes,
        q_presos,
        q_medidas,
        q_outros,
        equipe,
        procedimentos
    };
}

/**
 * Valida os horários do plantão e da equipe extraordinária.
 * Retorna null se OK, ou string com mensagem de erro.
 */
export function validarHorarios(dados: DadosFormulario): string | null {
    if (!dados.data_saida || !dados.hora_saida) return null;

    const entradaPlantao = new Date(`${dados.data_entrada}T${dados.hora_entrada}`);
    const saidaPlantao = new Date(`${dados.data_saida}T${dados.hora_saida}`);
    const diffH = (saidaPlantao.getTime() - entradaPlantao.getTime()) / 3_600_000;

    if (diffH <= 0) {
        return 'A data/hora de saída deve ser posterior à de entrada.';
    }
    if (diffH > 24) {
        return `O plantão não pode exceder 24 horas (atual: ${diffH.toFixed(1)}h).`;
    }

    for (const membro of dados.equipe) {
        if (membro.escala === 'Extraordinaria') {
            const entM = new Date(`${membro.data_entrada}T${membro.hora_entrada}`);
            const saiM = new Date(`${membro.data_saida}T${membro.hora_saida}`);
            if (!isNaN(entM.getTime()) && !isNaN(saiM.getTime())) {
                if (entM < entradaPlantao || saiM > saidaPlantao) {
                    return `Horário extraordinário de "${membro.nome}" está fora do período do plantão.`;
                }
            }
        }
    }

    return null;
}

/**
 * Cria os prepared statements para inserir equipe e procedimentos em batch.
 */
export function criarBatchEquipeProcedimentos(
    db: D1Database,
    plantaoId: number,
    dados: DadosFormulario
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const batch: any[] = [];

    for (const membro of dados.equipe) {
        batch.push(
            db.prepare(`INSERT INTO plantoes_equipe (plantao_id, nome_servidor, matricula, cargo, classe, escala, data_entrada, hora_entrada, data_saida, hora_saida) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                .bind(plantaoId, membro.nome, membro.matricula || null, membro.cargo || null, membro.classe || null, membro.escala, membro.data_entrada, membro.hora_entrada, membro.data_saida || null, membro.hora_saida || null)
        );
    }

    for (const proc of dados.procedimentos) {
        batch.push(
            db.prepare(`INSERT INTO plantoes_procedimentos (plantao_id, tipo, numero, natureza, envolvidos, resumo, vitimas_json, suspeitos_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
                .bind(plantaoId, proc.tipo, proc.numero || null, proc.natureza, proc.envolvidos || null, proc.resumo || null, proc.vitimas_json, proc.suspeitos_json)
        );
    }

    return batch;
}
