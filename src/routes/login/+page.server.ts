import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

function gerarSessionId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const load: PageServerLoad = async ({ locals, url }) => {
    // Se já estiver logado, redireciona
    if (locals.usuario) {
        throw redirect(302, url.searchParams.get('redirect') || '/plantao');
    }
    return { etapa: 'matricula' };
};

export const actions: Actions = {
    // Etapa 1: buscar servidor pela matrícula
    buscarServidor: async ({ request, platform }) => {
        const formData = await request.formData();
        const matricula = formData.get('matricula')?.toString().trim() || '';

        if (!matricula || matricula.length < 5) {
            return fail(400, { erro: 'Matrícula inválida. Digite sua matrícula completa.' });
        }

        if (!platform?.env.remocoespcce) {
            return fail(500, { erro: 'Banco de dados não configurado.' });
        }

        const db = platform.env.remocoespcce;

        try {
            const servidor = await db
                .prepare(`SELECT nome, matricula, email, cargo, lotacao FROM servidores WHERE matricula = ? AND ativo = 1 LIMIT 1`)
                .bind(matricula)
                .first<{ nome: string; matricula: string; email: string; cargo: string; lotacao: string }>();

            if (!servidor) {
                return fail(404, { erro: 'Matrícula não encontrada. Verifique seu número ou entre em contato com o administrador.' });
            }

            // Gera token de 6 dígitos
            const token = String(Math.floor(100000 + Math.random() * 900000));
            const agora = new Date();
            const expiracao = new Date(agora.getTime() + 15 * 60 * 1000); // 15 minutos

            // Invalida tokens anteriores deste email
            await db.prepare(`UPDATE tokens_acesso SET status = 'expirado' WHERE email = ? AND status = 'pendente'`)
                .bind(servidor.email)
                .run();

            // Salva novo token
            await db.prepare(`INSERT INTO tokens_acesso (email, token, expiracao, status) VALUES (?, ?, ?, 'pendente')`)
                .bind(servidor.email, token, expiracao.toISOString())
                .run();

            // Tenta enviar email se RESEND_API_KEY estiver configurada
            const resendKey = platform.env.RESEND_API_KEY;
            if (resendKey) {
                try {
                    await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${resendKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            from: 'DPI SUL <noreply@dpiul.ce.gov.br>',
                            to: [servidor.email],
                            subject: 'Seu código de acesso - Sistema de Plantões',
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #0a192f; color: #fff; border-radius: 8px;">
                                    <h2 style="color: #c5a059; text-align: center;">SISTEMA DE PLANTÕES</h2>
                                    <p>Olá, <strong>${servidor.nome}</strong>.</p>
                                    <p>Seu código de acesso é:</p>
                                    <div style="text-align: center; background: #c5a059; color: #0a192f; font-size: 36px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
                                        ${token}
                                    </div>
                                    <p style="color: #aaa; font-size: 12px; text-align: center;">Válido por 15 minutos. Não compartilhe este código.</p>
                                </div>
                            `
                        })
                    });
                } catch {
                    // Falha silenciosa no envio de email
                }
            }

            // Retorna dados do servidor (sem o token em produção com email configurado)
            const emailMascarado = servidor.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
            return {
                etapa: 'token',
                servidor: {
                    nome: servidor.nome,
                    matricula: servidor.matricula,
                    emailMascarado,
                    email: servidor.email
                },
                // Em dev (sem RESEND), mostra token na tela
                tokenDev: resendKey ? undefined : token
            };
        } catch (err) {
            console.error('Erro ao buscar servidor:', err);
            return fail(500, { erro: 'Erro interno ao processar a solicitação.' });
        }
    },

    // Etapa 2: validar token e criar sessão
    validarToken: async ({ request, platform, cookies, url }) => {
        const formData = await request.formData();
        const email = formData.get('email')?.toString().trim() || '';
        const token = formData.get('token')?.toString().trim() || '';

        if (!email || !token || token.length !== 6) {
            return fail(400, { erro: 'Token inválido. Digite os 6 dígitos recebidos por email.' });
        }

        if (!platform?.env.remocoespcce) {
            return fail(500, { erro: 'Banco de dados não configurado.' });
        }

        const db = platform.env.remocoespcce;
        const agora = new Date().toISOString();

        try {
            // Verifica token
            const registroToken = await db
                .prepare(`SELECT * FROM tokens_acesso WHERE email = ? AND token = ? AND status = 'pendente' AND expiracao > ? LIMIT 1`)
                .bind(email, token, agora)
                .first<{ id: number }>();

            if (!registroToken) {
                return fail(401, { erro: 'Código inválido ou expirado. Tente novamente.' });
            }

            // Invalida o token usado
            await db.prepare(`UPDATE tokens_acesso SET status = 'usado' WHERE id = ?`)
                .bind(registroToken.id)
                .run();

            // Busca dados do servidor
            const servidor = await db
                .prepare(`SELECT nome, matricula, email, cargo, lotacao FROM servidores WHERE email = ? LIMIT 1`)
                .bind(email)
                .first<{ nome: string; matricula: string; email: string; cargo: string; lotacao: string }>();

            if (!servidor) {
                return fail(404, { erro: 'Servidor não encontrado.' });
            }

            // Cria sessão
            const sessionId = gerarSessionId();
            const expiraSessao = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 horas

            await db
                .prepare(`INSERT INTO sessoes (session_id, matricula, nome, email, lotacao, cargo, criado_em, expira_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
                .bind(sessionId, servidor.matricula, servidor.nome, servidor.email, servidor.lotacao, servidor.cargo, agora, expiraSessao.toISOString())
                .run();

            // Define cookie de sessão
            cookies.set('session_id', sessionId, {
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                maxAge: 8 * 60 * 60 // 8 horas em segundos
            });

            const redirecionarPara = url.searchParams.get('redirect') || '/plantao';
            throw redirect(303, redirecionarPara);
        } catch (err) {
            if (isRedirect(err)) throw err;
            console.error('Erro ao validar token:', err);
            return fail(500, { erro: 'Erro interno ao processar a solicitação.' });
        }
    }
};
