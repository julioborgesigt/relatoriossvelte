/**
 * Funções utilitárias compartilhadas.
 * Centraliza helpers que antes estavam duplicados em múltiplos componentes.
 */

/** Converte data ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY) */
export function formatarData(d: string | null | undefined): string {
    if (!d) return '—';
    const [y, m, dd] = d.split('-');
    return `${dd}/${m}/${y}`;
}

/** Gera protocolo formatado a partir do ID, com fallback se protocolo for null */
export function formatarProtocolo(protocolo: string | null | undefined, id: number): string {
    return protocolo ?? `FT-${String(id).padStart(6, '0')}`;
}

/** Rótulo amigável para o status do plantão */
export function statusLabel(s: string): string {
    return s === 'finalizado' ? 'Finalizado'
         : s === 'retificado' ? 'Retificado'
         : s === 'rascunho'   ? 'Rascunho'
         : s;
}

/** Classes CSS para o badge de status (tema claro) */
export function statusCor(status: string): string {
    switch (status) {
        case 'finalizado': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
        case 'rascunho':   return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
        case 'retificado': return 'bg-blue-100 text-blue-700 border border-blue-200';
        default:           return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
}

/** Calcula horas entre entrada e saída, retornando string como "8h" ou "8h30m" */
export function calcularHoras(
    entrada_data: string,
    entrada_hora: string,
    saida_data: string,
    saida_hora: string
): string {
    if (!entrada_data || !entrada_hora || !saida_data || !saida_hora) {
        return '—';
    }
    try {
        const de = new Date(`${entrada_data}T${entrada_hora}`);
        const ate = new Date(`${saida_data}T${saida_hora}`);
        const diff = (ate.getTime() - de.getTime()) / (1000 * 60 * 60);
        if (isNaN(diff) || diff < 0) return '—';
        const h = Math.floor(diff);
        const m = Math.round((diff - h) * 60);
        return `${h}h${m > 0 ? m + 'm' : ''}`;
    } catch {
        return '—';
    }
}
