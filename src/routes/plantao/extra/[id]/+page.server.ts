import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { buscarPlantao, buscarEquipeExtra } from '$lib/server/plantaoQueries';

export const load: PageServerLoad = async ({ params, platform, url }) => {
    const db = getDb(platform);
    const { id } = params;

    const [plantao, equipeExtra] = await Promise.all([
        buscarPlantao(db, id),
        buscarEquipeExtra(db, id)
    ]);

    return {
        plantao,
        equipeExtra,
        config: {
            dir: url.searchParams.get('dir') ?? '',
            just: url.searchParams.get('just') ?? '',
            mb: url.searchParams.get('mb') ?? ''
        }
    };
};
