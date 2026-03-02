import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
    return {
        usuario: locals.usuario,
        pathname: url.pathname
    };
};
