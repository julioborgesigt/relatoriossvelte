import { fail, error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseFormularioPlantao, validarHorarios, criarBatchEquipeProcedimentos } from '$lib/server/parseFormData';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
    if (!locals.usuario) throw redirect(302, '/login');

    const db = platform?.env.remocoespcce;
    if (!db) throw error(500, 'Banco de dados não configurado.');

    const id = parseInt(params.id);

    const [plantao, equipe, procedimentos, delegaciasRes, servidoresRes] = await Promise.all([
        db.prepare(`SELECT * FROM plantoes WHERE id = ?`).bind(id).first<{
            id: number; protocolo: string; delegacia: string;
            data_entrada: string; hora_entrada: string;
            data_saida: string; hora_saida: string;
            observacoes: string; status: string;
            q_bo: number; q_guias: number; q_apreensoes: number;
            q_presos: number; q_medidas: number; q_outros: number;
        }>(),
        db.prepare(`SELECT * FROM plantoes_equipe WHERE plantao_id = ?`).bind(id).all<{
            nome_servidor: string; matricula: string; cargo: string; classe: string;
            escala: string; data_entrada: string; hora_entrada: string;
            data_saida: string; hora_saida: string;
        }>(),
        db.prepare(`SELECT * FROM plantoes_procedimentos WHERE plantao_id = ?`).bind(id).all<{
            tipo: string; numero: string; natureza: string; envolvidos: string;
            resumo: string; vitimas_json: string; suspeitos_json: string;
        }>(),
        db.prepare(`SELECT nome FROM delegacias WHERE status = 'SIM' OR status = 'TEMPORARIO' ORDER BY nome`).all<{ nome: string }>(),
        db.prepare(`SELECT nome, matricula, cargo, classe, lotacao FROM servidores WHERE ativo = 1 ORDER BY nome`).all<{ nome: string; matricula: string; cargo: string; classe: string; lotacao: string }>()
    ]);

    if (!plantao) throw error(404, 'Relatório não encontrado.');
    if (!['finalizado', 'retificado'].includes(plantao.status))
        throw error(400, 'Apenas relatórios finalizados podem ser retificados.');

    return {
        original: plantao,
        equipeOriginal: equipe.results ?? [],
        procedimentosOriginal: (procedimentos.results ?? []).map((p: { tipo: string; numero: string; natureza: string; envolvidos: string; resumo: string; vitimas_json: string; suspeitos_json: string }) => ({
            ...p,
            vitimas: p.vitimas_json ? JSON.parse(p.vitimas_json) as string[] : [],
            suspeitos: p.suspeitos_json ? JSON.parse(p.suspeitos_json) as string[] : []
        })),
        delegacias: delegaciasRes.results ?? [],
        servidores: servidoresRes.results ?? [],
        usuario: locals.usuario
    };
};

export const actions: Actions = {
    finalizar: async ({ request, platform, locals, params }) => {
        const db = platform?.env.remocoespcce;
        if (!db) return fail(500, { erro: 'Banco de dados não configurado.' });

        const usuario = locals.usuario;
        if (!usuario) return fail(401, { erro: 'Sessão expirada. Faça login novamente.' });

        const originalId = parseInt(params.id);
        const formData = await request.formData();
        const dados = parseFormularioPlantao(formData);

        if (!dados.delegacia || !dados.data_entrada || !dados.hora_entrada) {
            return fail(400, { erro: 'Preencha a unidade policial e os horários de entrada.' });
        }

        const erroHorario = validarHorarios(dados);
        if (erroHorario) return fail(400, { erro: erroHorario });

        const agora = new Date().toISOString();

        try {
            const atual = await db.prepare(`SELECT protocolo FROM plantoes WHERE id = ?`)
                .bind(originalId).first<{ protocolo: string }>();
            if (!atual) return fail(404, { erro: 'Relatório não encontrado.' });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const batch: any[] = [
                db.prepare(`UPDATE plantoes SET matricula_responsavel=?, nome_responsavel=?, delegacia=?, data_entrada=?, hora_entrada=?, data_saida=?, hora_saida=?, status='retificado', observacoes=?, q_bo=?, q_guias=?, q_apreensoes=?, q_presos=?, q_medidas=?, q_outros=?, atualizado_em=? WHERE id=?`)
                    .bind(usuario.matricula, usuario.nome, dados.delegacia, dados.data_entrada, dados.hora_entrada, dados.data_saida || null, dados.hora_saida || null, dados.observacoes || null, dados.q_bo, dados.q_guias, dados.q_apreensoes, dados.q_presos, dados.q_medidas, dados.q_outros, agora, originalId),
                db.prepare(`DELETE FROM plantoes_equipe WHERE plantao_id = ?`).bind(originalId),
                db.prepare(`DELETE FROM plantoes_procedimentos WHERE plantao_id = ?`).bind(originalId),
                ...criarBatchEquipeProcedimentos(db, originalId, dados)
            ];

            await db.batch(batch);

            return { sucesso: true, acao: 'finalizado', protocolo: atual.protocolo, id: originalId };
        } catch (err) {
            console.error('Erro ao salvar retificação:', err);
            return fail(500, { erro: 'Erro ao salvar os dados. Tente novamente.' });
        }
    }
};
