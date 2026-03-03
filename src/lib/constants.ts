/**
 * Constantes compartilhadas do sistema de plantões.
 */

/** Tipos de procedimento disponíveis */
export const TIPOS_PROC = ['IP-FLAGRANTE', 'IP-PORTARIA', 'TCO', 'AI/BOC'] as const;
export type TipoProc = typeof TIPOS_PROC[number];

/** Cores dos tipos de procedimento para badges em tema claro (dashboard/impressão) */
export const COR_TIPO_BADGE: Record<string, string> = {
    'IP-FLAGRANTE': 'bg-red-100 text-red-600',
    'IP-PORTARIA': 'bg-orange-100 text-orange-600',
    'TCO': 'bg-blue-100 text-blue-600',
    'AI/BOC': 'bg-purple-100 text-purple-600'
};

/** Cores dos tipos de procedimento para tema escuro (formulários) */
export const COR_TIPO_DARK: Record<string, string> = {
    'IP-FLAGRANTE': 'bg-red-900/60 border-red-500 text-red-300',
    'IP-PORTARIA': 'bg-orange-900/60 border-orange-500 text-orange-300',
    'TCO': 'bg-blue-900/60 border-blue-500 text-blue-300',
    'AI/BOC': 'bg-purple-900/60 border-purple-500 text-purple-300'
};

/** Cores dos tipos de procedimento para impressão (hex) */
export const COR_TIPO_PRINT: Record<string, string> = {
    'IP-FLAGRANTE': '#dc2626',
    'IP-PORTARIA': '#ea580c',
    'TCO': '#2563eb',
    'AI/BOC': '#7c3aed'
};
