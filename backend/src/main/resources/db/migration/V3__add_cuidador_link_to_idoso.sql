ALTER TABLE idosos ADD COLUMN cuidador_cpf VARCHAR(14);

ALTER TABLE idosos
    ADD CONSTRAINT fk_idoso_cuidador
    FOREIGN KEY (cuidador_cpf)
    REFERENCES cuidadores (cpf);

CREATE INDEX idx_idoso_cuidador ON idosos (cuidador_cpf);
