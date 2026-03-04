import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ platform, locals }) => {
    const db = platform?.env.remocoespcce;
    const vazio = { delegaciasAdmin: [], servidoresAdmin: [], usuario: locals.usuario };

    if (!db) return vazio;

    try {
        const [delegaciasAdmin, servidoresAdmin] = await Promise.all([
            db.prepare(`SELECT id, nome, status, data_expiracao FROM delegacias ORDER BY nome`).all(),
            db.prepare(`SELECT id, nome, matricula, cargo, classe, telefone, lotacao, email, ativo FROM servidores ORDER BY nome`).all()
        ]);

        return {
            delegaciasAdmin: delegaciasAdmin.results ?? [],
            servidoresAdmin: servidoresAdmin.results ?? [],
            usuario: locals.usuario,
            pageTitle: 'Administração — DPI SUL',
            pageHeading: 'Gerenciamento',
            pageSubheading: 'Administração de Unidades e Servidores Policiais'
        };
    } catch (err) {
        console.error('Erro na administração:', err);
        return vazio;
    }
};

export const actions: Actions = {
    default: async ({ request, platform, locals }) => {
        const db = platform?.env.remocoespcce;
        if (!db) return fail(500, { erro: 'Banco de dados não configurado.' });
        const usuario = locals.usuario;
        if (!usuario) return fail(401, { erro: 'Sessão expirada. Faça login novamente.' });

        const formData = await request.formData();
        const acao = formData.get('acao')?.toString();

        try {
            switch (acao) {
                case 'criar-delegacia': {
                    const nome = formData.get('nome')?.toString().trim() || '';
                    const status = formData.get('status')?.toString() || 'SIM';
                    const data_exp = formData.get('data_expiracao')?.toString() || null;
                    if (!nome) return fail(400, { erro: 'Nome da unidade é obrigatório.' });
                    await db.prepare(`INSERT INTO delegacias (nome,status,data_expiracao) VALUES (?, ?, ?)`)
                        .bind(nome, status, data_exp || null)
                        .run();
                    break;
                }
                case 'editar-delegacia': {
                    const id = parseInt(formData.get('id')?.toString() || '0');
                    if (!id) return fail(400, { erro: 'ID inválido.' });
                    const nome = formData.get('nome')?.toString().trim() || '';
                    const status = formData.get('status')?.toString() || 'SIM';
                    const data_exp = formData.get('data_expiracao')?.toString() || null;
                    await db.prepare(`UPDATE delegacias SET nome=?, status=?, data_expiracao=? WHERE id=?`)
                        .bind(nome, status, data_exp || null, id)
                        .run();
                    break;
                }
                case 'excluir-delegacia': {
                    const id = parseInt(formData.get('id')?.toString() || '0');
                    if (id) {
                        await db.prepare(`DELETE FROM delegacias WHERE id=?`).bind(id).run();
                    }
                    break;
                }
                case 'criar-servidor': {
                    const nome = formData.get('nome')?.toString().trim() || '';
                    const matricula = formData.get('matricula')?.toString().trim() || '';
                    const email = formData.get('email')?.toString().trim() || '';
                    const cargo = formData.get('cargo')?.toString().trim() || '';
                    const telefone = formData.get('telefone')?.toString().trim() || '';
                    const lotacao = formData.get('lotacao')?.toString().trim() || '';

                    if (!nome || !matricula || !email || !cargo || !telefone || !lotacao) {
                        return fail(400, { erro: 'Nome, matrícula, email, cargo, telefone e lotação são obrigatórios.' });
                    }
                    await db.prepare(`INSERT INTO servidores (nome,matricula,email,cargo,classe,telefone,lotacao,ativo) VALUES (?,?,?,?,?,?,?,?)`)
                        .bind(
                            nome,
                            matricula,
                            email,
                            cargo,
                            formData.get('classe')?.toString() || null,
                            telefone,
                            lotacao,
                            formData.get('ativo') === 'on' ? 1 : 0
                        )
                        .run();
                    break;
                }
                case 'editar-servidor': {
                    const id = parseInt(formData.get('id')?.toString() || '0');
                    if (!id) return fail(400, { erro: 'ID inválido.' });

                    const nome = formData.get('nome')?.toString().trim() || '';
                    const matricula = formData.get('matricula')?.toString().trim() || '';
                    const email = formData.get('email')?.toString().trim() || '';
                    const cargo = formData.get('cargo')?.toString().trim() || '';
                    const telefone = formData.get('telefone')?.toString().trim() || '';
                    const lotacao = formData.get('lotacao')?.toString().trim() || '';

                    if (!nome || !matricula || !email || !cargo || !telefone || !lotacao) {
                        return fail(400, { erro: 'Nome, matrícula, email, cargo, telefone e lotação são obrigatórios.' });
                    }

                    await db.prepare(`UPDATE servidores SET nome=?, matricula=?, email=?, cargo=?, classe=?, telefone=?, lotacao=?, ativo=? WHERE id=?`)
                        .bind(
                            nome,
                            matricula,
                            email,
                            cargo,
                            formData.get('classe')?.toString() || null,
                            telefone,
                            lotacao,
                            formData.get('ativo') === 'on' ? 1 : 0,
                            id
                        )
                        .run();
                    break;
                }
                case 'excluir-servidor': {
                    const id = parseInt(formData.get('id')?.toString() || '0');
                    if (id) {
                        await db.prepare(`DELETE FROM servidores WHERE id=?`).bind(id).run();
                    }
                    break;
                }
                default:
                    return fail(400, { erro: 'Ação desconhecida.' });
            }
        } catch (err) {
            console.error('Erro ao processar ação administrativa:', err);
            return fail(500, { erro: 'Erro ao executar operação administrativa.' });
        }

        return { sucesso: true };
    }
};
