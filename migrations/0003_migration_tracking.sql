-- ============================================================
-- MIGRAÇÃO 0003 - Tabela de controle de migrações
-- Registra quais migrações já foram executadas
-- ============================================================

CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    executado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Registra as migrações que já existiam antes deste controle
INSERT OR IGNORE INTO _migrations (nome) VALUES ('0001_initial_schema');
INSERT OR IGNORE INTO _migrations (nome) VALUES ('0002_seed_dev');
INSERT OR IGNORE INTO _migrations (nome) VALUES ('0003_migration_tracking');
