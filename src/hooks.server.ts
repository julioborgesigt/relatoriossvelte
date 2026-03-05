import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import type { Usuario } from '$lib/types';

// Rotas que não precisam de autenticação
const ROTAS_PUBLICAS = ['/login', '/api/'];

export const handle: Handle = async ({ event, resolve }) => {
    const { pathname } = event.url;

    // Verifica se a rota é pública
    const ehPublica = ROTAS_PUBLICAS.some(r => pathname.startsWith(r));

    // Tenta recuperar a sessão do cookie
    const sessionId = event.cookies.get('session_id');

    if (sessionId && event.platform?.env.remocoespcce) {
        try {
            const db = event.platform.env.remocoespcce;
            const agora = new Date().toISOString();

            const sessao_raw = await db
                .prepare(`SELECT s.*, serv.is_admin FROM sessoes s LEFT JOIN servidores serv ON s.matricula = serv.matricula WHERE s.session_id = ? AND s.expira_em > ? LIMIT 1`)
                .bind(sessionId, agora)
                .first<Usuario & { is_admin?: number }>();

            if (sessao_raw) {
                event.locals.usuario = sessao_raw;
            }
        } catch (err) {
            console.error('Erro ao verificar sessão:', err);
        }
    }

    // Redireciona para login se não autenticado e rota protegida
    if (!ehPublica && !event.locals.usuario) {
        const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
        throw redirect(302, loginUrl);
    }

    return resolve(event);
};
