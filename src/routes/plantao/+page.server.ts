import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, locals }) => {
    const db = platform?.env.remocoespcce;
    if (!db) return { delegacias: [], servidores: [], usuario: locals.usuario };

    const [delegaciasRes, servidoresRes] = await Promise.all([
        db.prepare(`SELECT nome FROM delegacias WHERE status = 'SIM' OR status = 'TEMPORARIO' ORDER BY nome`).all<{ nome: string }>(),
        db.prepare(`SELECT nome, matricula, cargo, classe FROM servidores WHERE ativo = 1 ORDER BY nome`).all<{ nome: string; matricula: string; cargo: string; classe: string }>()
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
    // Salva ou finaliza o relatório de plantão
    salvar: async ({ request, platform, locals }) => {
        const db = platform?.env.remocoespcce;
        if (!db) return fail(500, { erro: 'Banco de dados não configurado.' });

        const usuario = locals.usuario;
        if (!usuario) return fail(401, { erro: 'Sessão expirada. Faça login novamente.' });

        const formData = await request.formData();
        const acao = formData.get('acao')?.toString() || 'rascunho';

        const delegacia = formData.get('delegacia')?.toString().toUpperCase().trim() || '';
        const data_entrada = formData.get('data_entrada')?.toString() || '';
        const hora_entrada = formData.get('hora_entrada')?.toString() || '';
        const data_saida = formData.get('data_saida')?.toString() || '';
        const hora_saida = formData.get('hora_saida')?.toString() || '';
        const observacoes = formData.get('observacoes')?.toString().toUpperCase().trim() || '';

        if (!delegacia || !data_entrada || !hora_entrada) {
            return fail(400, { erro: 'Preencha a unidade policial e os horários de entrada.' });
        }

        // Quantitativos
        const q_bo = parseInt(formData.get('q_bo')?.toString() || '0') || 0;
        const q_guias = parseInt(formData.get('q_guias')?.toString() || '0') || 0;
        const q_apreensoes = parseInt(formData.get('q_apreensoes')?.toString() || '0') || 0;
        const q_presos = parseInt(formData.get('q_presos')?.toString() || '0') || 0;
        const q_medidas = parseInt(formData.get('q_medidas')?.toString() || '0') || 0;
        const q_outros = parseInt(formData.get('q_outros')?.toString() || '0') || 0;

        // Equipe
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

        // Procedimentos qualitativos
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
        const status = acao === 'finalizar' ? 'finalizado' : 'rascunho';

        try {
            const { meta } = await db
                .prepare(`INSERT INTO plantoes (matricula_responsavel, nome_responsavel, delegacia, data_entrada, hora_entrada, data_saida, hora_saida, status, observacoes, q_bo, q_guias, q_apreensoes, q_presos, q_medidas, q_outros, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                .bind(usuario.matricula, usuario.nome, delegacia, data_entrada, hora_entrada, data_saida || null, hora_saida || null, status, observacoes || null, q_bo, q_guias, q_apreensoes, q_presos, q_medidas, q_outros, agora, agora)
                .run();

            const plantaoId = meta.last_row_id;
            const protocolo = gerarProtocolo(plantaoId);

            // Atualiza o protocolo
            await db.prepare(`UPDATE plantoes SET protocolo = ? WHERE id = ?`)
                .bind(protocolo, plantaoId)
                .run();

            // Salva equipe e procedimentos em batch
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const batch: any[] = [];

            for (const membro of equipe) {
                batch.push(db.prepare(`INSERT INTO plantoes_equipe (plantao_id, nome_servidor, matricula, cargo, classe, escala, data_entrada, hora_entrada, data_saida, hora_saida) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                    .bind(plantaoId, membro.nome, membro.matricula || null, membro.cargo || null, membro.classe || null, membro.escala, membro.data_entrada, membro.hora_entrada, membro.data_saida || null, membro.hora_saida || null));
            }

            for (const proc of procedimentos) {
                batch.push(db.prepare(`INSERT INTO plantoes_procedimentos (plantao_id, tipo, numero, natureza, envolvidos, resumo, vitimas_json, suspeitos_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
                    .bind(plantaoId, proc.tipo, proc.numero || null, proc.natureza, proc.envolvidos || null, proc.resumo || null, proc.vitimas_json, proc.suspeitos_json));
            }

            if (batch.length > 0) {
                await db.batch(batch);
            }

            if (acao === 'finalizar') {
                throw redirect(303, `/plantao/imprimir/${plantaoId}`);
            }

            return { sucesso: true, mensagem: `Rascunho salvo! Protocolo: ${protocolo}`, protocolo };
        } catch (err) {
            if (err instanceof Response) throw err;
            console.error('Erro ao salvar plantão:', err);
            return fail(500, { erro: 'Erro ao salvar os dados. Tente novamente.' });
        }
    },

    // Carrega um rascunho pelo código R-XXXXXX
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
