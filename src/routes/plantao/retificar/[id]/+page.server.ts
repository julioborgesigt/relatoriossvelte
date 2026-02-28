import { fail, error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

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
        procedimentosOriginal: (procedimentos.results ?? []).map(p => ({
            ...p,
            vitimas: p.vitimas_json ? JSON.parse(p.vitimas_json) as string[] : [],
            suspeitos: p.suspeitos_json ? JSON.parse(p.suspeitos_json) as string[] : []
        })),
        delegacias: delegaciasRes.results ?? [],
        servidores: servidoresRes.results ?? [],
        usuario: locals.usuario
    };
};

function gerarProtocolo(id: number): string {
    return `FT-${String(id).padStart(6, '0')}`;
}

export const actions: Actions = {
    finalizar: async ({ request, platform, locals, params }) => {
        const db = platform?.env.remocoespcce;
        if (!db) return fail(500, { erro: 'Banco de dados não configurado.' });

        const usuario = locals.usuario;
        if (!usuario) return fail(401, { erro: 'Sessão expirada. Faça login novamente.' });

        const originalId = parseInt(params.id);
        const formData = await request.formData();

        const delegacia = formData.get('delegacia')?.toString().toUpperCase().trim() || '';
        const data_entrada = formData.get('data_entrada')?.toString() || '';
        const hora_entrada = formData.get('hora_entrada')?.toString() || '';
        const data_saida = formData.get('data_saida')?.toString() || '';
        const hora_saida = formData.get('hora_saida')?.toString() || '';
        const observacoes = formData.get('observacoes')?.toString().toUpperCase().trim() || '';

        if (!delegacia || !data_entrada || !hora_entrada) {
            return fail(400, { erro: 'Preencha a unidade policial e os horários de entrada.' });
        }

        const q_bo = parseInt(formData.get('q_bo')?.toString() || '0') || 0;
        const q_guias = parseInt(formData.get('q_guias')?.toString() || '0') || 0;
        const q_apreensoes = parseInt(formData.get('q_apreensoes')?.toString() || '0') || 0;
        const q_presos = parseInt(formData.get('q_presos')?.toString() || '0') || 0;
        const q_medidas = parseInt(formData.get('q_medidas')?.toString() || '0') || 0;
        const q_outros = parseInt(formData.get('q_outros')?.toString() || '0') || 0;

        const equipe: { nome: string; matricula: string; cargo: string; classe: string; escala: string; data_entrada: string; hora_entrada: string; data_saida: string; hora_saida: string }[] = [];
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

        const procedimentos: { tipo: string; numero: string; natureza: string; envolvidos: string; resumo: string; vitimas_json: string; suspeitos_json: string }[] = [];
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

        const agora = new Date().toISOString();

        try {
            // Busca o protocolo atual (mantido inalterado — o número não muda)
            const atual = await db.prepare(`SELECT protocolo FROM plantoes WHERE id = ?`)
                .bind(originalId).first<{ protocolo: string }>();
            if (!atual) return fail(404, { erro: 'Relatório não encontrado.' });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const batch: any[] = [
                // Atualiza o registro original no lugar (sem criar novo)
                db.prepare(`UPDATE plantoes SET matricula_responsavel=?, nome_responsavel=?, delegacia=?, data_entrada=?, hora_entrada=?, data_saida=?, hora_saida=?, status='retificado', observacoes=?, q_bo=?, q_guias=?, q_apreensoes=?, q_presos=?, q_medidas=?, q_outros=?, atualizado_em=? WHERE id=?`)
                    .bind(usuario.matricula, usuario.nome, delegacia, data_entrada, hora_entrada, data_saida || null, hora_saida || null, observacoes || null, q_bo, q_guias, q_apreensoes, q_presos, q_medidas, q_outros, agora, originalId),
                // Remove equipe e procedimentos antigos
                db.prepare(`DELETE FROM plantoes_equipe WHERE plantao_id = ?`).bind(originalId),
                db.prepare(`DELETE FROM plantoes_procedimentos WHERE plantao_id = ?`).bind(originalId)
            ];

            for (const membro of equipe) {
                batch.push(db.prepare(`INSERT INTO plantoes_equipe (plantao_id, nome_servidor, matricula, cargo, classe, escala, data_entrada, hora_entrada, data_saida, hora_saida) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                    .bind(originalId, membro.nome, membro.matricula || null, membro.cargo || null, membro.classe || null, membro.escala, membro.data_entrada, membro.hora_entrada, membro.data_saida || null, membro.hora_saida || null));
            }

            for (const proc of procedimentos) {
                batch.push(db.prepare(`INSERT INTO plantoes_procedimentos (plantao_id, tipo, numero, natureza, envolvidos, resumo, vitimas_json, suspeitos_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
                    .bind(originalId, proc.tipo, proc.numero || null, proc.natureza, proc.envolvidos || null, proc.resumo || null, proc.vitimas_json, proc.suspeitos_json));
            }

            await db.batch(batch);

            // Mesmo id e protocolo — o número do relatório não muda
            return { sucesso: true, acao: 'finalizado', protocolo: atual.protocolo, id: originalId };
        } catch (err) {
            console.error('Erro ao salvar retificação:', err);
            return fail(500, { erro: 'Erro ao salvar os dados. Tente novamente.' });
        }
    }
};
