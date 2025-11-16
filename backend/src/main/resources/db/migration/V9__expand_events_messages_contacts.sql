ALTER TABLE idosos
    ADD COLUMN nome_contato_emergencia VARCHAR(150) NULL,
    ADD COLUMN contato_emergencia VARCHAR(32) NULL;

ALTER TABLE eventos
    ADD COLUMN titulo VARCHAR(255) NULL,
    ADD COLUMN data DATE NULL,
    ADD COLUMN hora_inicio TIME NULL,
    ADD COLUMN hora_fim TIME NULL,
    ADD COLUMN local_evento VARCHAR(255) NULL,
    ADD COLUMN categoria VARCHAR(60) NULL,
    ADD COLUMN observacoes TEXT NULL;

UPDATE eventos
SET data = DATE(data_hora),
    hora_inicio = TIME(data_hora)
WHERE data_hora IS NOT NULL AND (data IS NULL OR hora_inicio IS NULL);

ALTER TABLE eventos
    MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE';

CREATE TABLE contatos_emergencia (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    idoso_cpf VARCHAR(14) NOT NULL,
    nome VARCHAR(120) NOT NULL,
    telefone VARCHAR(32) NOT NULL,
    relacao VARCHAR(80),
    observacoes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_contatos_emergencia_idoso FOREIGN KEY (idoso_cpf)
        REFERENCES idosos(cpf)
        ON DELETE CASCADE
);
