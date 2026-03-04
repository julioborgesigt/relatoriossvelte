import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const isAdmin = ['00000000', '12312312', '12345678'].includes(locals.usuario?.matricula || '');
    if (isAdmin) {
        throw redirect(302, '/dashboard');
    }
    throw redirect(302, '/plantao');
};
