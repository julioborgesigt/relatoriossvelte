import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { buscarPlantao, buscarEquipeExtra } from '$lib/server/plantaoQueries';

export const load: PageServerLoad = async ({ params, platform, url }) => {
    const db = getDb(platform);
    const { id } = params;

    const [plantao, equipeExtra] = await Promise.all([
        buscarPlantao(db, id),
        buscarEquipeExtra(db, id)
    ]);

    if (!plantao) {
        throw error(404, 'Plantão não encontrado.');
    }

    const retorno: any = {
        plantao,
        equipeExtra,
        config: {
            dir: url.searchParams.get('dir') ?? '',
            just: url.searchParams.get('just') ?? '',
            mb: url.searchParams.get('mb') ?? ''
        },
        pageHeading: `Relatório Extra ${plantao.protocolo}`
    };

    if (plantao && plantao.protocolo) {
        retorno.pageTitle = `Relatório Extra ${plantao.protocolo} — DPI SUL`;
    }

    return retorno;
};
