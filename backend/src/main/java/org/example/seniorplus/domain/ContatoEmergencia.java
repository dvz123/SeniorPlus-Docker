package org.example.seniorplus.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "contatos_emergencia")
public class ContatoEmergencia extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "idoso_cpf", length = 14, nullable = false)
    private String idosoCpf;

    @Column(length = 120, nullable = false)
    private String nome;

    @Column(length = 32, nullable = false)
    private String telefone;

    @Column(length = 80)
    private String relacao;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getIdosoCpf() {
        return idosoCpf;
    }

    public void setIdosoCpf(String idosoCpf) {
        this.idosoCpf = idosoCpf;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getRelacao() {
        return relacao;
    }

    public void setRelacao(String relacao) {
        this.relacao = relacao;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }
}
