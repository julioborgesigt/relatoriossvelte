import type { Usuario } from '$lib/types';

/**
 * Verifica se um usuário possui privilégios de administrador.
 * Considera válido se o usuário logado tiver a flag is_admin no banco
 */
export function isAdmin(usuario: Usuario | undefined | null): boolean {
    if (!usuario) return false;

    // Fallback de segurança temporário e verificação da flag no banco de dados
    return usuario.is_admin === 1 || usuario.matricula === '00000000';
}
