package org.example.seniorplus.domain;

import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "enderecos")
public class Endereco extends BaseEntity {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "logradouro", nullable = false)
    private String rua;

    @Column
    private String numero;

    @Column(nullable = false)
    private String bairro;

    @Column(nullable = false)
    private String cidade;

    @Column(length = 2, nullable = false)
    private String estado;

    @Column(length = 9, nullable = false)
    private String cep;

    private String complemento;

    @Column(name = "idoso_id")
    private String idosoCpf;

    @Column(name = "cuidador_id")
    private String cuidadorCpf;

    public Endereco() {}

    public Endereco(String idosoCpf, String rua, String numero, String bairro, String cidade, 
                String estado, String cep, String complemento) {
        this.idosoCpf = idosoCpf;
        this.rua = rua;
        this.numero = numero;
        this.bairro = bairro;
        this.cidade = cidade;
        this.estado = estado;
        this.cep = cep;
        this.complemento = complemento;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRua() {
        return rua;
    }

    public void setRua(String rua) {
        this.rua = rua;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public String getBairro() {
        return bairro;
    }

    public void setBairro(String bairro) {
        this.bairro = bairro;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getCep() {
        return cep;
    }

    public void setCep(String cep) {
        this.cep = cep;
    }

    public String getComplemento() {
        return complemento;
    }

    public void setComplemento(String complemento) {
        this.complemento = complemento;
    }

    public String getIdosoCpf() {
        return idosoCpf;
    }

    public void setIdosoCpf(String idosoCpf) {
        this.idosoCpf = idosoCpf;
    }

    public String getCuidadorCpf() {
        return cuidadorCpf;
    }

    public void setCuidadorCpf(String cuidadorCpf) {
        this.cuidadorCpf = cuidadorCpf;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Endereco endereco = (Endereco) o;
        return Objects.equals(id, endereco.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
