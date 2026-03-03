import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { buscarPlantao, buscarEquipe, buscarProcedimentos } from '$lib/server/plantaoQueries';

export const load: PageServerLoad = async ({ params, platform }) => {
    const db = getDb(platform);
    const { id } = params;

    const [plantao, equipe, procedimentos] = await Promise.all([
        buscarPlantao(db, id),
        buscarEquipe(db, id),
        buscarProcedimentos(db, id)
    ]);

    return { plantao, equipe, procedimentos };
};
