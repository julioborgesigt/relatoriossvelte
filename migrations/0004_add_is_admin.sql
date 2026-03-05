-- Adiciona a coluna is_admin na tabela de servidores
ALTER TABLE servidores ADD COLUMN is_admin INTEGER DEFAULT 0;

-- Define a matrícula 00000000 como admin (caso exista)
UPDATE servidores SET is_admin = 1 WHERE matricula = '00000000';

-- Garante que o usuário 00000000 exista e seja administrador
INSERT OR IGNORE INTO servidores (nome, matricula, email, cargo, lotacao, ativo, is_admin)
VALUES ('Administrador Geral', '00000000', 'admin@dpisul.ce.gov.br', 'Administrador', 'DPI SUL', 1, 1);
