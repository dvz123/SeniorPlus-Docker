CREATE TABLE usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE idosos (
    cpf VARCHAR(14) PRIMARY KEY,
    rg VARCHAR(20) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    data_nascimento DATE NOT NULL,
    telefone VARCHAR(20),
    peso DECIMAL(5,2),
    altura DECIMAL(3,2),
    tipo_sanguineo VARCHAR(5),
    observacao TEXT,
    imc VARCHAR(10),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE cuidadores (
    cpf VARCHAR(14) PRIMARY KEY,
    rg VARCHAR(20) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    data_nascimento DATE NOT NULL,
    telefone VARCHAR(20),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE enderecos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    logradouro VARCHAR(255) NOT NULL,
    numero VARCHAR(10),
    complemento VARCHAR(255),
    bairro VARCHAR(255) NOT NULL,
    cidade VARCHAR(255) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    cep VARCHAR(9) NOT NULL,
    idoso_id VARCHAR(14),
    cuidador_id VARCHAR(14),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (idoso_id) REFERENCES idosos(cpf),
    FOREIGN KEY (cuidador_id) REFERENCES cuidadores(cpf)
);

CREATE TABLE consultas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cpf VARCHAR(14) NOT NULL,
    nome_medico VARCHAR(255) NOT NULL,
    especialidade VARCHAR(255) NOT NULL,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    local VARCHAR(255) NOT NULL,
    observacoes TEXT,
    img_receita TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (cpf) REFERENCES idosos(cpf)
);

CREATE TABLE medicamentos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cpf VARCHAR(14) NOT NULL,
    nome_medicamento VARCHAR(255) NOT NULL,
    dosagem VARCHAR(255) NOT NULL,
    forma_administracao VARCHAR(255) NOT NULL,
    instrucoes TEXT,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    repetir_diariamente BOOLEAN DEFAULT FALSE,
    intervalo_horas INT,
    nome_usuario VARCHAR(255) NOT NULL,
    contato_emergencia VARCHAR(255),
    notificar_por_email BOOLEAN DEFAULT FALSE,
    notificar_por_app BOOLEAN DEFAULT FALSE,
    notificar_por_sms BOOLEAN DEFAULT FALSE,
    intervalo_minutos INT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (cpf) REFERENCES idosos(cpf)
);

CREATE TABLE reset_senha_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    usuario_id BIGINT NOT NULL,
    data_expiracao TIMESTAMP NOT NULL,
    utilizado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE dietas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cpf VARCHAR(14) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    restricoes_alimentares TEXT,
    recomendacoes TEXT,
    quantidade_refeicoes INT,
    intervalo_entre_refeicoes VARCHAR(255),
    refeicao1 TEXT,
    refeicao2 TEXT,
    refeicao3 TEXT,
    refeicao4 TEXT,
    refeicao5 TEXT,
    refeicao6 TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (cpf) REFERENCES idosos(cpf)
);

CREATE TABLE exercicios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cpf VARCHAR(14) NOT NULL,
    tipo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data DATE NOT NULL,
    duracao_minutos INT NOT NULL,
    intensidade VARCHAR(50) NOT NULL,
    observacoes TEXT,
    link_video TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (cpf) REFERENCES idosos(cpf)
);

CREATE TABLE exames_medicos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cpf VARCHAR(14) NOT NULL,
    tipo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data DATE NOT NULL,
    hora TIME,
    local VARCHAR(255),
    resultado TEXT,
    observacoes TEXT,
    anexos TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (cpf) REFERENCES idosos(cpf)
);

CREATE TABLE imagens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cpf VARCHAR(14) NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    data_upload TIMESTAMP NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (cpf) REFERENCES idosos(cpf)
);