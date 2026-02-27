-- Tabela principal do Plantão
CREATE TABLE plantoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matricula_responsavel TEXT,
    delegacia TEXT,
    data_entrada TEXT,
    hora_entrada TEXT,
    data_saida TEXT,
    hora_saida TEXT,
    q_bo INTEGER DEFAULT 0,
    q_guia INTEGER DEFAULT 0,
    q_apre INTEGER DEFAULT 0,
    q_pres INTEGER DEFAULT 0,
    q_medi INTEGER DEFAULT 0,
    q_outr INTEGER DEFAULT 0,
    observacoes TEXT,
    status TEXT DEFAULT 'rascunho',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para a Equipe de Serviço (1 plantão tem vários policiais)
CREATE TABLE plantoes_equipe (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plantao_id INTEGER,
    nome_servidor TEXT,
    FOREIGN KEY(plantao_id) REFERENCES plantoes(id) ON DELETE CASCADE
);

-- Tabela para o Detalhamento Qualitativo
CREATE TABLE plantoes_procedimentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plantao_id INTEGER,
    descricao TEXT,
    FOREIGN KEY(plantao_id) REFERENCES plantoes(id) ON DELETE CASCADE
);  