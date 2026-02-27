-- ============================================================
-- MIGRAÇÃO INICIAL - Sistema de Plantões DPI SUL
-- Criado para Cloudflare D1 (SQLite)
-- ============================================================

-- Tabela de servidores (efetivo policial)
CREATE TABLE IF NOT EXISTS servidores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    matricula TEXT NOT NULL UNIQUE,
    cargo TEXT,
    classe TEXT,
    telefone TEXT,
    lotacao TEXT,
    email TEXT NOT NULL,
    ativo INTEGER DEFAULT 1
);

-- Tabela de delegacias autorizadas
CREATE TABLE IF NOT EXISTS delegacias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    status TEXT DEFAULT 'SIM',         -- SIM | NAO | TEMPORARIO
    data_expiracao TEXT
);

-- Tabela de tokens de acesso (autenticação por email)
CREATE TABLE IF NOT EXISTS tokens_acesso (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    expiracao TEXT NOT NULL,
    status TEXT DEFAULT 'pendente'     -- pendente | usado | expirado
);

-- Tabela de sessões ativas
CREATE TABLE IF NOT EXISTS sessoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL UNIQUE,
    matricula TEXT NOT NULL,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    lotacao TEXT,
    cargo TEXT,
    criado_em TEXT NOT NULL,
    expira_em TEXT NOT NULL
);

-- Tabela principal de plantões
CREATE TABLE IF NOT EXISTS plantoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    protocolo TEXT,
    matricula_responsavel TEXT,
    nome_responsavel TEXT,
    delegacia TEXT NOT NULL,
    data_entrada TEXT NOT NULL,
    hora_entrada TEXT NOT NULL,
    data_saida TEXT,
    hora_saida TEXT,
    status TEXT DEFAULT 'rascunho',    -- rascunho | finalizado | retificado
    observacoes TEXT,
    -- Quantitativos
    q_bo INTEGER DEFAULT 0,
    q_guias INTEGER DEFAULT 0,
    q_apreensoes INTEGER DEFAULT 0,
    q_presos INTEGER DEFAULT 0,
    q_medidas INTEGER DEFAULT 0,
    q_outros INTEGER DEFAULT 0,
    -- Controle
    criado_em TEXT NOT NULL,
    atualizado_em TEXT,
    retificacao_de INTEGER            -- ID do plantão original (retificação)
);

-- Tabela de membros da equipe do plantão
CREATE TABLE IF NOT EXISTS plantoes_equipe (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plantao_id INTEGER NOT NULL,
    nome_servidor TEXT NOT NULL,
    matricula TEXT,
    cargo TEXT,
    classe TEXT,
    escala TEXT DEFAULT 'Normal',     -- Normal | Extraordinaria
    data_entrada TEXT,
    hora_entrada TEXT,
    data_saida TEXT,
    hora_saida TEXT,
    horas_trabalhadas REAL,
    FOREIGN KEY (plantao_id) REFERENCES plantoes(id)
);

-- Tabela de procedimentos qualitativos
CREATE TABLE IF NOT EXISTS plantoes_procedimentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plantao_id INTEGER NOT NULL,
    tipo TEXT,                         -- IP-FLAGRANTE | IP-PORTARIA | TCO | AI/BOC
    numero TEXT,
    natureza TEXT,
    envolvidos TEXT,
    resumo TEXT,
    vitimas_json TEXT,                 -- JSON: ["nome1", "nome2"]
    suspeitos_json TEXT,               -- JSON: ["nome1", "nome2"]
    FOREIGN KEY (plantao_id) REFERENCES plantoes(id)
);

-- Tabela de rascunhos (código R-XXXXXX)
CREATE TABLE IF NOT EXISTS rascunhos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    matricula TEXT NOT NULL,
    dados_json TEXT NOT NULL,
    criado_em TEXT NOT NULL,
    expira_em TEXT NOT NULL,
    status TEXT DEFAULT 'ativo'        -- ativo | finalizado
);

-- Tabela legada de remoções (mantida para compatibilidade)
CREATE TABLE IF NOT EXISTS remocoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    status TEXT DEFAULT 'pendente',
    data_criacao TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_plantoes_status ON plantoes(status);
CREATE INDEX IF NOT EXISTS idx_plantoes_data ON plantoes(data_entrada);
CREATE INDEX IF NOT EXISTS idx_plantoes_matricula ON plantoes(matricula_responsavel);
CREATE INDEX IF NOT EXISTS idx_equipe_plantao ON plantoes_equipe(plantao_id);
CREATE INDEX IF NOT EXISTS idx_procedimentos_plantao ON plantoes_procedimentos(plantao_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_session_id ON sessoes(session_id);
CREATE INDEX IF NOT EXISTS idx_tokens_email ON tokens_acesso(email);
CREATE INDEX IF NOT EXISTS idx_servidores_matricula ON servidores(matricula);
CREATE INDEX IF NOT EXISTS idx_rascunhos_codigo ON rascunhos(codigo);
