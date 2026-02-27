import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, platform }) => {
    const sessionId = cookies.get('session_id');

    if (sessionId && platform?.env.remocoespcce) {
        try {
            await platform.env.remocoespcce
                .prepare(`DELETE FROM sessoes WHERE session_id = ?`)
                .bind(sessionId)
                .run();
        } catch {
            // Ignora erros ao deletar sessão
        }
    }

    cookies.delete('session_id', { path: '/' });
    throw redirect(303, '/login');
};
