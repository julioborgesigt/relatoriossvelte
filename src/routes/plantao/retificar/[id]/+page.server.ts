import { fail, error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { criarBatchEquipeProcedimentos } from '$lib/server/parseFormData';
import { getDb } from '$lib/server/db';
import { buscarPlantao, buscarEquipe, buscarProcedimentos, buscarDelegacias, buscarServidores } from '$lib/server/plantaoQueries';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { PlantaoSchema } from '$lib/schemas/plantao';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
    if (!locals.usuario) throw redirect(302, '/login');

    const db = getDb(platform);
    const id = parseInt(params.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const form = await superValidate(zod4(PlantaoSchema as any));

    const [plantao, equipeOriginal, procedimentosOriginal, delegacias, servidores] = await Promise.all([
        buscarPlantao(db, id),
        buscarEquipe(db, id),
        buscarProcedimentos(db, id),
        buscarDelegacias(db),
        buscarServidores(db)
    ]);

    if (!['finalizado', 'retificado'].includes(plantao.status))
        throw error(400, 'Apenas relatórios finalizados podem ser retificados.');

    return {
        form,
        original: plantao,
        equipeOriginal,
        procedimentosOriginal,
        delegacias,
        servidores,
    };
};

export const actions: Actions = {
    finalizar: async ({ request, platform, locals, params }) => {
        const db = getDb(platform);

        const usuario = locals.usuario;
        if (!usuario) return fail(401, { erro: 'Sessão expirada. Faça login novamente.' });

        const originalId = parseInt(params.id);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const form = await superValidate(request, zod4(PlantaoSchema as any));

        if (!form.valid) {
            return fail(400, { form, erro: 'Existem erros no preenchimento do formulário.' });
        }

        const dados = form.data as import('$lib/schemas/plantao').PlantaoSchemaType;
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

            return { form, sucesso: true, acao: 'finalizado', protocolo: atual.protocolo, id: originalId };
        } catch (err) {
            console.error('Erro ao salvar retificação:', err);
            return fail(500, { form, erro: 'Erro ao salvar os dados. Tente novamente.' });
        }
    }
};
