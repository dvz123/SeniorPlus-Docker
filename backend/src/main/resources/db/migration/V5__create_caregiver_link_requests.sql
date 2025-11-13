CREATE TABLE caregiver_link_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    idoso_cpf VARCHAR(14) NOT NULL,
    cuidador_cpf VARCHAR(14) NOT NULL,
    status VARCHAR(20) NOT NULL,
    mensagem VARCHAR(255),
    responded_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_link_request_idoso FOREIGN KEY (idoso_cpf) REFERENCES idosos(cpf),
    CONSTRAINT fk_link_request_cuidador FOREIGN KEY (cuidador_cpf) REFERENCES cuidadores(cpf)
);

CREATE INDEX idx_link_request_idoso_status ON caregiver_link_requests (idoso_cpf, status);
CREATE INDEX idx_link_request_cuidador ON caregiver_link_requests (cuidador_cpf);
