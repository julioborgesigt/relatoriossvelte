import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseFormularioPlantao, validarHorarios, criarBatchEquipeProcedimentos } from '$lib/server/parseFormData';
import { buscarDelegacias, buscarServidores } from '$lib/server/plantaoQueries';

export const load: PageServerLoad = async ({ url, platform }) => {
    const db = platform?.env.remocoespcce;
    if (!db) return { delegacias: [], servidores: [], rascunhoCarregado: null };

    const [delegacias, servidores] = await Promise.all([
        buscarDelegacias(db),
        buscarServidores(db)
    ]);

    let rascunhoCarregado = null;
    const rascunhoProtocolo = url.searchParams.get('rascunho');

    if (rascunhoProtocolo) {
        try {
            const plantao = await db.prepare("SELECT * FROM plantoes WHERE protocolo = ? AND status = 'rascunho' LIMIT 1").bind(rascunhoProtocolo).first();
            if (plantao) {
                const equipe = await db.prepare("SELECT * FROM plantoes_equipe WHERE plantao_id = ?").bind(plantao.id).all();
                const procedimentos = await db.prepare("SELECT * FROM plantoes_procedimentos WHERE plantao_id = ?").bind(plantao.id).all();

                const procedimentosProcessados = procedimentos.results.map((p: any) => ({
                    ...p,
                    vitimas: p.vitimas_json ? JSON.parse(p.vitimas_json) : [],
                    suspeitos: p.suspeitos_json ? JSON.parse(p.suspeitos_json) : []
                }));

                rascunhoCarregado = {
                    dados: plantao,
                    equipe: equipe.results,
                    procedimentos: procedimentosProcessados
                };
            }
        } catch (e) {
            console.error("Erro ao carregar rascunho:", e);
        }
    }

    return { delegacias, servidores, rascunhoCarregado };
};

function gerarProtocolo(id: number): string {
    return `FT-${String(id).padStart(6, '0')}`;
}

function gerarCodigoRascunho(id: number): string {
    return `R-${String(id).padStart(6, '0')}`;
}

export const actions: Actions = {
    salvar: async ({ request, platform, locals }) => {
        const db = platform?.env.remocoespcce;
        if (!db) return fail(500, { erro: 'Banco de dados não configurado.' });

        const usuario = locals.usuario;
        if (!usuario) return fail(401, { erro: 'Sessão expirada. Faça login novamente.' });

        const formData = await request.formData();
        const acao = formData.get('acao')?.toString() || 'rascunho';
        const draftId = formData.get('draft_id')?.toString();
        const dados = parseFormularioPlantao(formData);

        if (!dados.delegacia || !dados.data_entrada || !dados.hora_entrada) {
            return fail(400, { erro: 'Preencha a unidade policial e os horários de entrada.' });
        }

        const erroHorario = validarHorarios(dados);
        if (erroHorario) return fail(400, { erro: erroHorario });

        const agora = new Date().toISOString();
        const status = acao === 'finalizar' ? 'finalizado' : 'rascunho';

        try {
            let plantaoId = 0;
            let protocolo = '';

            if (draftId && parseInt(draftId) > 0) {
                plantaoId = parseInt(draftId);
                protocolo = acao === 'finalizar' ? gerarProtocolo(plantaoId) : gerarCodigoRascunho(plantaoId);

                await db.prepare(`UPDATE plantoes SET matricula_responsavel = ?, nome_responsavel = ?, delegacia = ?, data_entrada = ?, hora_entrada = ?, data_saida = ?, hora_saida = ?, status = ?, observacoes = ?, q_bo = ?, q_guias = ?, q_apreensoes = ?, q_presos = ?, q_medidas = ?, q_outros = ?, atualizado_em = ?, protocolo = ? WHERE id = ?`)
                    .bind(usuario.matricula, usuario.nome, dados.delegacia, dados.data_entrada, dados.hora_entrada, dados.data_saida || null, dados.hora_saida || null, status, dados.observacoes || null, dados.q_bo, dados.q_guias, dados.q_apreensoes, dados.q_presos, dados.q_medidas, dados.q_outros, agora, protocolo, plantaoId)
                    .run();

                await db.prepare("DELETE FROM plantoes_equipe WHERE plantao_id = ?").bind(plantaoId).run();
                await db.prepare("DELETE FROM plantoes_procedimentos WHERE plantao_id = ?").bind(plantaoId).run();
            } else {
                const { meta } = await db
                    .prepare(`INSERT INTO plantoes (matricula_responsavel, nome_responsavel, delegacia, data_entrada, hora_entrada, data_saida, hora_saida, status, observacoes, q_bo, q_guias, q_apreensoes, q_presos, q_medidas, q_outros, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                    .bind(usuario.matricula, usuario.nome, dados.delegacia, dados.data_entrada, dados.hora_entrada, dados.data_saida || null, dados.hora_saida || null, status, dados.observacoes || null, dados.q_bo, dados.q_guias, dados.q_apreensoes, dados.q_presos, dados.q_medidas, dados.q_outros, agora, agora)
                    .run();

                plantaoId = meta.last_row_id;
                protocolo = acao === 'finalizar'
                    ? gerarProtocolo(plantaoId)
                    : gerarCodigoRascunho(plantaoId);

                await db.prepare(`UPDATE plantoes SET protocolo = ? WHERE id = ?`)
                    .bind(protocolo, plantaoId)
                    .run();
            }

            const batch = criarBatchEquipeProcedimentos(db, plantaoId, dados);
            if (batch.length > 0) {
                await db.batch(batch);
            }

            if (acao === 'finalizar') {
                return { sucesso: true, acao: 'finalizado', mensagem: `Relatório finalizado! Protocolo: ${protocolo}`, protocolo, id: plantaoId };
            }

            return { sucesso: true, mensagem: `Rascunho salvo! Protocolo: ${protocolo}`, protocolo };
        } catch (err) {
            console.error('Erro ao salvar plantão:', err);
            return fail(500, { erro: 'Erro ao salvar os dados. Tente novamente.' });
        }
    },

    carregarRascunho: async ({ request }) => {
        const formData = await request.formData();
        const codigo = formData.get('codigo')?.toString().toUpperCase().trim() || '';

        if (!codigo.startsWith('R-')) {
            return fail(400, { erro: 'Código inválido. Use o formato R-XXXXXX.' });
        }

        throw redirect(303, `/plantao?rascunho=${codigo}`);
    }
};
