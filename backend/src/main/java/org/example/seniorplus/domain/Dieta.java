package org.example.seniorplus.domain;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name = "dietas")
public class Dieta extends BaseEntity {
    private static final long serialVersionUID = 1L;

    @Id
    private String cpf;
    private String nome;
    private String descricao;
    private LocalDate dataInicio;
    private LocalDate dataFim;
    private String restricoesAlimentares;
    private String recomendacoes;
    private int quantidadeRefeicoes;
    private String intervaloEntreRefeicoes;

    private String refeicao1;
    private String refeicao2;
    private String refeicao3;
    private String refeicao4;
    private String refeicao5;
    private String refeicao6;

    public Dieta() {}

    public Dieta(String cpf, String nome, String descricao, LocalDate dataInicio, LocalDate dataFim,
                 String restricoesAlimentares, String recomendacoes, int quantidadeRefeicoes,
                 String intervaloEntreRefeicoes, String refeicao1, String refeicao2, String refeicao3,
                 String refeicao4, String refeicao5, String refeicao6) {
        this.cpf = cpf;
        this.nome = nome;
        this.descricao = descricao;
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.restricoesAlimentares = restricoesAlimentares;
        this.recomendacoes = recomendacoes;
        this.quantidadeRefeicoes = quantidadeRefeicoes;
        this.intervaloEntreRefeicoes = intervaloEntreRefeicoes;
        this.refeicao1 = refeicao1;
        this.refeicao2 = refeicao2;
        this.refeicao3 = refeicao3;
        this.refeicao4 = refeicao4;
        this.refeicao5 = refeicao5;
        this.refeicao6 = refeicao6;
    }

    // Getters e Setters
    public String getId() {
        return cpf;
    }

    public void setId(String id) {
        this.cpf = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public LocalDate getDataInicio() {
        return dataInicio;
    }

    public void setDataInicio(LocalDate dataInicio) {
        this.dataInicio = dataInicio;
    }

    public LocalDate getDataFim() {
        return dataFim;
    }

    public void setDataFim(LocalDate dataFim) {
        this.dataFim = dataFim;
    }

    public String getRestricoesAlimentares() {
        return restricoesAlimentares;
    }

    public void setRestricoesAlimentares(String restricoesAlimentares) {
        this.restricoesAlimentares = restricoesAlimentares;
    }

    public String getRecomendacoes() {
        return recomendacoes;
    }

    public void setRecomendacoes(String recomendacoes) {
        this.recomendacoes = recomendacoes;
    }

    public int getQuantidadeRefeicoes() {
        return quantidadeRefeicoes;
    }

    public void setQuantidadeRefeicoes(int quantidadeRefeicoes) {
        this.quantidadeRefeicoes = quantidadeRefeicoes;
    }

    public String getIntervaloEntreRefeicoes() {
        return intervaloEntreRefeicoes;
    }

    public void setIntervaloEntreRefeicoes(String intervaloEntreRefeicoes) {
        this.intervaloEntreRefeicoes = intervaloEntreRefeicoes;
    }

    public String getRefeicao1() {
        return refeicao1;
    }

    public void setRefeicao1(String refeicao1) {
        this.refeicao1 = refeicao1;
    }

    public String getRefeicao2() {
        return refeicao2;
    }

    public void setRefeicao2(String refeicao2) {
        this.refeicao2 = refeicao2;
    }

    public String getRefeicao3() {
        return refeicao3;
    }

    public void setRefeicao3(String refeicao3) {
        this.refeicao3 = refeicao3;
    }

    public String getRefeicao4() {
        return refeicao4;
    }

    public void setRefeicao4(String refeicao4) {
        this.refeicao4 = refeicao4;
    }

    public String getRefeicao5() {
        return refeicao5;
    }

    public void setRefeicao5(String refeicao5) {
        this.refeicao5 = refeicao5;
    }

    public String getRefeicao6() {
        return refeicao6;
    }

    public void setRefeicao6(String refeicao6) {
        this.refeicao6 = refeicao6;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Dieta dieta = (Dieta) o;
        return Objects.equals(cpf, dieta.cpf);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(cpf);
    }
}