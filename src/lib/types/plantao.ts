export type MembroEquipe = {
    nome: string;
    matricula: string;
    cargo: string;
    classe: string;
    escala: string;
    data_entrada: string;
    hora_entrada: string;
    data_saida: string;
    hora_saida: string;
};

export type ProcedimentoQualitativo = {
    tipo: string;
    numero: string;
    natureza: string;
    envolvidos: string;
    resumo: string;
    vitimas_json: string;
    suspeitos_json: string;
};

export type DadosFormulario = {
    delegacia: string;
    data_entrada: string;
    hora_entrada: string;
    data_saida: string;
    hora_saida: string;
    observacoes: string;
    q_bo: number;
    q_guias: number;
    q_apreensoes: number;
    q_presos: number;
    q_medidas: number;
    q_outros: number;
    equipe: MembroEquipe[];
    procedimentos: ProcedimentoQualitativo[];
};
