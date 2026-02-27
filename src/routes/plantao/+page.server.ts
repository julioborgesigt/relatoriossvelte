import { fail, redirect, type Actions } from '@sveltejs/kit';

export const actions: Actions = {
	salvar: async ({ request, platform }) => {
		const formData = await request.formData();

		// 1. Extração com nomes consistentes
		const delegacia = formData.get('delegacia')?.toString().toUpperCase() || '';
		const data_entrada = formData.get('data_entrada')?.toString() || '';
		const hora_entrada = formData.get('hora_entrada')?.toString() || '';
		const data_saida = formData.get('data_saida')?.toString() || '';
		const hora_saida = formData.get('hora_saida')?.toString() || '';
		const acao = formData.get('acao')?.toString() || 'rascunho';

		// 2. Extração da equipe
		const equipe: string[] = [];
		for (const [key, value] of formData.entries()) {
			if (key.startsWith('equipe_') && value) {
				equipe.push(value.toString().toUpperCase());
			}
		}

		// 3. Extração dos procedimentos estruturados
		const listaProcedimentos: { nat: string; env: string; res: string }[] = [];
		for (let i = 0; formData.has(`proc_natureza_${i}`); i++) {
			const nat = formData.get(`proc_natureza_${i}`)?.toString().toUpperCase() || '';
			const env = formData.get(`proc_envolvidos_${i}`)?.toString().toUpperCase() || '';
			const res = formData.get(`proc_resumo_${i}`)?.toString().toUpperCase() || '';
			if (nat || env || res) {
				listaProcedimentos.push({ nat, env, res });
			}
		}

		const db = platform?.env.remocoespcce;
		if (!db) return fail(500, { message: 'Banco de dados D1 não configurado.' });

		let lastId: number;

		try {
			// Inserção do Plantão Principal - Nomes corrigidos aqui
			const { meta } = await db
				.prepare(
					`INSERT INTO plantoes (delegacia, data_entrada, hora_entrada, data_saida, hora_saida, status)
                     VALUES (?, ?, ?, ?, ?, ?)`
				)
				.bind(delegacia, data_entrada, hora_entrada, data_saida, hora_saida, acao)
				.run();

			lastId = meta.last_row_id;

			const comandosBatch: any[] = [];

			// Adiciona Equipe ao Batch
			equipe.forEach((nome) => {
				comandosBatch.push(
					db.prepare('INSERT INTO plantoes_equipe (plantao_id, nome_servidor) VALUES (?, ?)').bind(lastId, nome)
				);
			});

			// Adiciona Procedimentos ao Batch - Variável corrigida para listaProcedimentos
			listaProcedimentos.forEach((p) => {
				comandosBatch.push(
					db
						.prepare(
							'INSERT INTO plantoes_procedimentos (plantao_id, natureza, envolvidos, resumo) VALUES (?, ?, ?, ?)'
						)
						.bind(lastId, p.nat, p.env, p.res)
				);
			});

			if (comandosBatch.length > 0) {
				await db.batch(comandosBatch);
			}
		} catch (err) {
			console.error('Erro no D1:', err);
			return fail(500, { message: 'Erro ao gravar dados no banco local.' });
		}

		// Redirecionamento movido para fora do try/catch para o SvelteKit interceptar corretamente
		if (acao === 'finalizar') {
			throw redirect(303, `/plantao/imprimir/${lastId}`);
		}

		return { success: true, message: 'Rascunho salvo com sucesso!' };
	}
};