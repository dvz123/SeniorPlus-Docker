package org.example.seniorplus.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "imagens")
public class Imagem extends BaseEntity {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  // identificador único da imagem

    private String cpf; // CPF do usuário
    private String nomeArquivo;
    private String url;
    private String tipo;
    private LocalDateTime dataUpload;

    public Imagem() {}

    public Imagem(Long id, String cpf, String nomeArquivo, String url, String tipo, LocalDateTime dataUpload) {
        this.id = id;
        this.cpf = cpf;
        this.nomeArquivo = nomeArquivo;
        this.url = url;
        this.tipo = tipo;
        this.dataUpload = dataUpload;
    }

    // Getters e setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getNomeArquivo() {
        return nomeArquivo;
    }

    public void setNomeArquivo(String nomeArquivo) {
        this.nomeArquivo = nomeArquivo;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public LocalDateTime getDataUpload() {
        return dataUpload;
    }

    public void setDataUpload(LocalDateTime dataUpload) {
        this.dataUpload = dataUpload;
    }
}
