-- ============================================================
-- DADOS DE DESENVOLVIMENTO (SEED)
-- Execute apenas em ambiente de desenvolvimento/teste
-- ============================================================

-- Delegacias autorizadas da DPI SUL
INSERT OR IGNORE INTO delegacias (nome, status) VALUES
    ('DELEGACIA REGIONAL DE IGUATU', 'SIM'),
    ('DELEGACIA REGIONAL DE JUAZEIRO DO NORTE', 'SIM'),
    ('DELEGACIA REGIONAL DE CRATO', 'SIM'),
    ('DELEGACIA REGIONAL DE SOBRAL', 'SIM'),
    ('DELEGACIA REGIONAL DE QUIXADÁ', 'SIM'),
    ('DELEGACIA REGIONAL DE ARACATI', 'SIM'),
    ('DELEGACIA REGIONAL DE TAUÁ', 'SIM'),
    ('DELEGACIA REGIONAL DE ITAPIPOCA', 'SIM'),
    ('DELEGACIA REGIONAL DE TIANGUÁ', 'SIM'),
    ('DELEGACIA REGIONAL DE CRATEÚS', 'SIM'),
    ('1ª DELEGACIA MUNICIPAL DE IGUATU', 'SIM'),
    ('2ª DELEGACIA MUNICIPAL DE JUAZEIRO DO NORTE', 'SIM'),
    ('DELEGACIA DE CRIMES CONTRA A MULHER - IGUATU', 'SIM'),
    ('DELEGACIA DE CRIMES CONTRA A MULHER - JUAZEIRO', 'SIM'),
    ('DEPARTAMENTO DE POLÍCIA DO INTERIOR SUL', 'SIM');

-- Servidor de exemplo para testes (senha/token via email)
INSERT OR IGNORE INTO servidores (nome, matricula, cargo, classe, lotacao, email, ativo) VALUES
    ('DELEGADO EXEMPLO SILVA', '12345678', 'DELEGADO DE POLÍCIA', '3ª CLASSE', 'DELEGACIA REGIONAL DE IGUATU', 'delegado@exemplo.ce.gov.br', 1),
    ('INSPETOR TESTE SOUZA', '87654321', 'INSPETOR DE POLÍCIA', '1ª CLASSE', 'DELEGACIA REGIONAL DE IGUATU', 'inspetor@exemplo.ce.gov.br', 1),
    ('ESCRIVÃO DEMO COSTA', '11223344', 'ESCRIVÃO DE POLÍCIA', '2ª CLASSE', 'DELEGACIA REGIONAL DE IGUATU', 'escrivao@exemplo.ce.gov.br', 1);
