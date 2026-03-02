import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseFormularioPlantao, validarHorarios, criarBatchEquipeProcedimentos } from '$lib/server/parseFormData';

export const load: PageServerLoad = async ({ platform, locals }) => {
    const db = platform?.env.remocoespcce;
    if (!db) return { delegacias: [], servidores: [], usuario: locals.usuario };

    const [delegaciasRes, servidoresRes] = await Promise.all([
        db.prepare(`SELECT nome FROM delegacias WHERE status = 'SIM' OR status = 'TEMPORARIO' ORDER BY nome`).all<{ nome: string }>(),
        db.prepare(`SELECT nome, matricula, cargo, classe, lotacao FROM servidores WHERE ativo = 1 ORDER BY nome`).all<{ nome: string; matricula: string; cargo: string; classe: string; lotacao: string }>()
    ]);

    return {
        delegacias: delegaciasRes.results ?? [],
        servidores: servidoresRes.results ?? [],
        usuario: locals.usuario
    };
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
        const dados = parseFormularioPlantao(formData);

        if (!dados.delegacia || !dados.data_entrada || !dados.hora_entrada) {
            return fail(400, { erro: 'Preencha a unidade policial e os horários de entrada.' });
        }

        const erroHorario = validarHorarios(dados);
        if (erroHorario) return fail(400, { erro: erroHorario });

        const agora = new Date().toISOString();
        const status = acao === 'finalizar' ? 'finalizado' : 'rascunho';

        try {
            const { meta } = await db
                .prepare(`INSERT INTO plantoes (matricula_responsavel, nome_responsavel, delegacia, data_entrada, hora_entrada, data_saida, hora_saida, status, observacoes, q_bo, q_guias, q_apreensoes, q_presos, q_medidas, q_outros, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                .bind(usuario.matricula, usuario.nome, dados.delegacia, dados.data_entrada, dados.hora_entrada, dados.data_saida || null, dados.hora_saida || null, status, dados.observacoes || null, dados.q_bo, dados.q_guias, dados.q_apreensoes, dados.q_presos, dados.q_medidas, dados.q_outros, agora, agora)
                .run();

            const plantaoId = meta.last_row_id;
            const protocolo = acao === 'finalizar'
                ? gerarProtocolo(plantaoId)
                : gerarCodigoRascunho(plantaoId);

            await db.prepare(`UPDATE plantoes SET protocolo = ? WHERE id = ?`)
                .bind(protocolo, plantaoId)
                .run();

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

    carregarRascunho: async ({ request, platform }) => {
        const db = platform?.env.remocoespcce;
        if (!db) return fail(500, { erro: 'Banco de dados não configurado.' });

        const formData = await request.formData();
        const codigo = formData.get('codigo')?.toString().toUpperCase().trim() || '';

        if (!codigo.startsWith('R-')) {
            return fail(400, { erro: 'Código inválido. Use o formato R-XXXXXX.' });
        }

        const agora = new Date().toISOString();

        try {
            const rascunho = await db
                .prepare(`SELECT * FROM rascunhos WHERE codigo = ? AND expira_em > ? AND status = 'ativo' LIMIT 1`)
                .bind(codigo, agora)
                .first<{ dados_json: string }>();

            if (!rascunho) {
                return fail(404, { erro: 'Rascunho não encontrado ou expirado (válido por 36 horas).' });
            }

            return { rascunhoCarregado: JSON.parse(rascunho.dados_json) };
        } catch (err) {
            console.error('Erro ao carregar rascunho:', err);
            return fail(500, { erro: 'Erro ao carregar o rascunho.' });
        }
    }
};
