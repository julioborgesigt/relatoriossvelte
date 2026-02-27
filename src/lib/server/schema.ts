import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Tabela de servidores (efetivo policial)
export const servidores = sqliteTable('servidores', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    nome: text('nome').notNull(),
    matricula: text('matricula').notNull().unique(),
    cargo: text('cargo'),
    classe: text('classe'),
    telefone: text('telefone'),
    lotacao: text('lotacao'),
    email: text('email').notNull(),
    ativo: integer('ativo', { mode: 'boolean' }).default(true)
});

// Tabela de delegacias autorizadas
export const delegacias = sqliteTable('delegacias', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    nome: text('nome').notNull(),
    status: text('status').default('SIM'), // SIM | NAO | TEMPORARIO
    data_expiracao: text('data_expiracao')
});

// Tabela de tokens de acesso (autenticação por email)
export const tokensAcesso = sqliteTable('tokens_acesso', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull(),
    token: text('token').notNull(),
    expiracao: text('expiracao').notNull(),
    status: text('status').default('pendente') // pendente | usado
});

// Tabela de sessões ativas
export const sessoes = sqliteTable('sessoes', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    session_id: text('session_id').notNull().unique(),
    matricula: text('matricula').notNull(),
    nome: text('nome').notNull(),
    email: text('email').notNull(),
    lotacao: text('lotacao'),
    cargo: text('cargo'),
    criado_em: text('criado_em').notNull(),
    expira_em: text('expira_em').notNull()
});

// Tabela principal de plantões
export const plantoes = sqliteTable('plantoes', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    protocolo: text('protocolo'),             // FT-000001 após finalização
    matricula_responsavel: text('matricula_responsavel'),
    nome_responsavel: text('nome_responsavel'),
    delegacia: text('delegacia').notNull(),
    data_entrada: text('data_entrada').notNull(),
    hora_entrada: text('hora_entrada').notNull(),
    data_saida: text('data_saida'),
    hora_saida: text('hora_saida'),
    status: text('status').default('rascunho'), // rascunho | finalizado | retificado
    observacoes: text('observacoes'),
    // Quantitativos
    q_bo: integer('q_bo').default(0),
    q_guias: integer('q_guias').default(0),
    q_apreensoes: integer('q_apreensoes').default(0),
    q_presos: integer('q_presos').default(0),
    q_medidas: integer('q_medidas').default(0),
    q_outros: integer('q_outros').default(0),
    // Controle
    criado_em: text('criado_em').notNull(),
    atualizado_em: text('atualizado_em'),
    retificacao_de: integer('retificacao_de') // ID do plantão original em caso de retificação
});

// Tabela de equipe do plantão
export const plantaoEquipe = sqliteTable('plantoes_equipe', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    plantao_id: integer('plantao_id').notNull(),
    nome_servidor: text('nome_servidor').notNull(),
    matricula: text('matricula'),
    cargo: text('cargo'),
    classe: text('classe'),
    escala: text('escala').default('Normal'), // Normal | Extraordinaria
    data_entrada: text('data_entrada'),
    hora_entrada: text('hora_entrada'),
    data_saida: text('data_saida'),
    hora_saida: text('hora_saida'),
    horas_trabalhadas: real('horas_trabalhadas')
});

// Tabela de procedimentos qualitativos do plantão
export const plantaoProcedimentos = sqliteTable('plantoes_procedimentos', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    plantao_id: integer('plantao_id').notNull(),
    tipo: text('tipo'), // IP-FLAGRANTE | IP-PORTARIA | TCO | AI/BOC
    numero: text('numero'),
    natureza: text('natureza'),    // crime/infração
    envolvidos: text('envolvidos'), // texto descritivo
    resumo: text('resumo'),
    vitimas_json: text('vitimas_json'),    // JSON: [{nome, qualificacao}]
    suspeitos_json: text('suspeitos_json') // JSON: [{nome, qualificacao}]
});

// Tabela de rascunhos (com código R-XXXXXX para retomada)
export const rascunhos = sqliteTable('rascunhos', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    codigo: text('codigo').notNull().unique(), // R-000001
    matricula: text('matricula').notNull(),
    dados_json: text('dados_json').notNull(),  // JSON com estado completo do formulário
    criado_em: text('criado_em').notNull(),
    expira_em: text('expira_em').notNull(),
    status: text('status').default('ativo') // ativo | finalizado
});

// Tabela legada de remoções (mantida para compatibilidade)
export const remocoes = sqliteTable('remocoes', {
    id: integer('id').primaryKey(),
    nome: text('nome').notNull(),
    status: text('status').default('pendente'),
    dataCriacao: text('data_criacao')
});
