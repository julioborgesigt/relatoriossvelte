/**
 * Tipos compartilhados do sistema de plantões.
 * Centraliza tipos que antes estavam duplicados em múltiplos arquivos.
 */

/** Dados do usuário autenticado (espelha App.Locals.usuario) */
export type Usuario = {
    matricula: string;
    nome: string;
    email: string;
    lotacao: string | null;
    cargo: string | null;
    is_admin?: number;
};

/** Registro completo de um plantão no banco de dados */
export type PlantaoRecord = {
    id: number;
    protocolo: string;
    nome_responsavel: string;
    matricula_responsavel: string;
    delegacia: string;
    data_entrada: string;
    hora_entrada: string;
    data_saida: string;
    hora_saida: string;
    status: string;
    observacoes: string;
    q_bo: number;
    q_guias: number;
    q_apreensoes: number;
    q_presos: number;
    q_medidas: number;
    q_outros: number;
    criado_em: string;
};

/** Plantão com agregações para listagem no dashboard */
export type PlantaoListItem = PlantaoRecord & {
    total_equipe: number;
    total_procedimentos: number;
    servidores_equipe: string | null;
    tipos_procedimento: string | null;
};

/** Registro de membro da equipe no banco de dados */
export type EquipeRecord = {
    nome_servidor: string;
    matricula: string;
    cargo: string;
    classe: string;
    escala: string;
    data_entrada: string;
    hora_entrada: string;
    data_saida: string;
    hora_saida: string;
};

/** Registro de procedimento no banco de dados */
export type ProcedimentoRecord = {
    tipo: string;
    numero: string;
    natureza: string;
    envolvidos: string;
    resumo: string;
    vitimas_json: string;
    suspeitos_json: string;
};

/** Procedimento com vítimas e suspeitos já parseados do JSON */
export type ProcedimentoFormatado = ProcedimentoRecord & {
    vitimas: string[];
    suspeitos: string[];
};
