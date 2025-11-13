package org.example.seniorplus.domain;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name = "exercicios")
public class Exercicio extends BaseEntity {
    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String cpf; // CPF do usuário/paciente
    private String tipo; // Ex: Caminhada, Musculação, Yoga
    private String descricao;
    private LocalDate data;
    private int duracaoMinutos;
    private String intensidade; // leve, moderada, intensa
    private String observacoes;
    private String linkVideo;

    public Exercicio() {}

    public Exercicio(String cpf, String tipo, String descricao, LocalDate data,
                           int duracaoMinutos, String intensidade, String observacoes) {
        this.cpf = cpf;
        this.tipo = tipo;
        this.descricao = descricao;
        this.data = data;
        this.duracaoMinutos = duracaoMinutos;
        this.intensidade = intensidade;
        this.observacoes = observacoes;
    }

    // Getters e Setters
    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public LocalDate getData() {
        return data;
    }

    public void setData(LocalDate data) {
        this.data = data;
    }

    public int getDuracaoMinutos() {
        return duracaoMinutos;
    }

    public void setDuracaoMinutos(int duracaoMinutos) {
        this.duracaoMinutos = duracaoMinutos;
    }

    public String getIntensidade() {
        return intensidade;
    }

    public void setIntensidade(String intensidade) {
        this.intensidade = intensidade;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public String getLinkVideo() {
        return linkVideo;
    }

    public void setLinkVideo(String linkVideo) {
        this.linkVideo = linkVideo;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Exercicio)) return false;
        Exercicio that = (Exercicio) o;
        return Objects.equals(cpf, that.cpf);
    }

    @Override
    public int hashCode() {
        return Objects.hash(cpf);
    }
}
