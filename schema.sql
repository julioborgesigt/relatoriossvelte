-- schema.sql
CREATE TABLE IF NOT EXISTS remocoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_indiciado TEXT NOT NULL,
    origem TEXT NOT NULL,
    destino TEXT NOT NULL,
    data_solicitacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pendente'
);