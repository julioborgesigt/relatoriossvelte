import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { buscarPlantoesPorUsuario, buscarHorasExtrasUsuario, buscarDelegacias } from '$lib/server/plantaoQueries';
import { calcularHoras } from '$lib/utils';
import type { PlantaoListItem } from '$lib/types';

const POR_PAGINA = 10;

export const load: PageServerLoad = async ({ platform, url, locals }) => {
    // Redireciona se não estiver logado
    if (!locals.usuario) {
        throw redirect(302, '/login');
    }

    const matricula = locals.usuario.matricula;
    const db = getDb(platform);

    const vazio = {
        plantoes: [] as PlantaoListItem[],
        delegacias: [] as string[],
        horasExtrasTotaisTexto: '0h',
        horasExtrasDecimais: 0,
        paginacao: { pagina: 1, porPagina: POR_PAGINA, totalRegistros: 0, totalPaginas: 0 },
    };

    const pagina = Math.max(1, parseInt(url.searchParams.get('pagina') ?? '1') || 1);
    const offset = (pagina - 1) * POR_PAGINA;

    try {
        const [plantoesResult, delegaciasResult, horasExtrasResult] = await Promise.all([
            buscarPlantoesPorUsuario(db, matricula, POR_PAGINA, offset),
            buscarDelegacias(db),
            buscarHorasExtrasUsuario(db, matricula)
        ]);

        // Cálculo das horas extras
        let horasDecimais = 0;

        for (const item of horasExtrasResult) {
            if (item.data_entrada && item.hora_entrada && item.data_saida && item.hora_saida) {
                const de = new Date(`${item.data_entrada}T${item.hora_entrada}`);
                const ate = new Date(`${item.data_saida}T${item.hora_saida}`);
                const diffMs = ate.getTime() - de.getTime();
                if (!isNaN(diffMs) && diffMs > 0) {
                    horasDecimais += diffMs / (1000 * 60 * 60);
                }
            }
        }

        const h = Math.floor(horasDecimais);
        const m = Math.round((horasDecimais - h) * 60);
        const textoHoras = `${h}h${m > 0 ? m + 'm' : ''}`;

        return {
            plantoes: plantoesResult.results as PlantaoListItem[],
            delegacias: delegaciasResult.map(d => d.nome),
            horasExtrasTotaisTexto: textoHoras,
            horasExtrasDecimais: horasDecimais,
            paginacao: {
                pagina,
                porPagina: POR_PAGINA,
                totalRegistros: plantoesResult.total,
                totalPaginas: Math.ceil(plantoesResult.total / POR_PAGINA)
            }
        };

    } catch (err) {
        console.error('Erro em meus-relatorios:', err);
        return vazio;
    }
};
