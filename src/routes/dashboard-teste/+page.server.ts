import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

// Definimos a interface fora da função para ser reutilizada
interface Remocao {
    id: number;
    nome_indiciado: string;
    origem: string;
    destino: string;
    data_solicitacao: string;
    status: 'pendente' | 'concluida';
}

export const load: PageServerLoad = async ({ platform }) => {
    // 1. Buscamos os dados (ou iniciamos um array vazio caso o banco não responda)
    const results = await platform?.env?.remocoespcce?.prepare(
        "SELECT * FROM remocoes LIMIT 100"
    ).all();

    // 2. Garantimos que registros seja um array de Remocao, mesmo se results for null
    const registros = (results?.results || []) as unknown as Remocao[];

    // 3. Agora calculamos as estatísticas com segurança
    return {
        registros,
        estatisticas: {
            total: registros.length,
            pendentes: registros.filter((r: Remocao) => r.status === 'pendente').length,
            concluidas: registros.filter((r: Remocao) => r.status === 'concluida').length
        },
        // Enviamos um aviso caso o platform não tenha sido detectado (comum em dev no Windows)
        env_detectado: !!platform?.env?.remocoespcce
    };
};

export const actions = {
    atualizarStatus: async ({ request, platform }) => {
        const formData = await request.formData();
        const id = formData.get('id');
        const novoStatus = formData.get('status');

        if (!id || !novoStatus) return fail(400, { message: 'Dados inválidos' });

        await platform?.env.remocoespcce.prepare(
            "UPDATE remocoes SET status = ? WHERE id = ?"
        ).bind(novoStatus, id).run();

        // Retornamos o novo status para a confirmação visual
        return { 
            success: true, 
            statusAlterado: novoStatus 
        };
    }
} satisfies Actions;