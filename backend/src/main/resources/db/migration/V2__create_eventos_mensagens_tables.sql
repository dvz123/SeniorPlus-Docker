CREATE TABLE IF NOT EXISTS eventos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    data_hora DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL,
    idoso_id VARCHAR(14) NOT NULL,
    FOREIGN KEY (idoso_id) REFERENCES idosos(cpf)
);

CREATE TABLE IF NOT EXISTS mensagens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conteudo TEXT NOT NULL,
    data_hora DATETIME NOT NULL,
    remetente VARCHAR(100) NOT NULL,
    destinatario VARCHAR(100) NOT NULL,
    idoso_id VARCHAR(14) NOT NULL,
    FOREIGN KEY (idoso_id) REFERENCES idosos(cpf)
);

CREATE TABLE IF NOT EXISTS medicamento_horarios (
    medicamento_id BIGINT NOT NULL,
    horario TIME NOT NULL,
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id),
    PRIMARY KEY (medicamento_id, horario)
);