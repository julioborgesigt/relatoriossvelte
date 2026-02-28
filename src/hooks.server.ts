import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

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

            const sessao = await db
                .prepare(`SELECT * FROM sessoes WHERE session_id = ? AND expira_em > ? LIMIT 1`)
                .bind(sessionId, agora)
                .first<{
                    matricula: string;
                    nome: string;
                    email: string;
                    lotacao: string | null;
                    cargo: string | null;
                }>();

            if (sessao) {
                event.locals.usuario = {
                    matricula: sessao.matricula,
                    nome: sessao.nome,
                    email: sessao.email,
                    lotacao: sessao.lotacao,
                    cargo: sessao.cargo
                };
            }
        } catch {
            // Silently ignore DB errors on session check
        }
    }

    // Redireciona para login se não autenticado e rota protegida
    if (!ehPublica && !event.locals.usuario) {
        const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
        throw redirect(302, loginUrl);
    }

    return resolve(event);
};
