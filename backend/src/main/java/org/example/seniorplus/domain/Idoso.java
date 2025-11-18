package org.example.seniorplus.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "idosos")
public class Idoso extends BaseEntity {
    private static final long serialVersionUID = 1L;

    @Id
    @Column(length = 14, nullable = false, unique = true)
    private String cpf;
    
    @Column(length = 20)
    private String rg;
    
    @Column(nullable = false)
    private String nome;
    
    @Column(unique = true)
    private String email;
    
    @Temporal(TemporalType.DATE)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date dataNascimento;
    
    @Column(length = 20)
    private String telefone;
    
    @Column(length = 20)
    private String genero;

    @Column(name = "estado_civil", length = 40)
    private String estadoCivil;

    @Column
    private Integer idade;

    @Column(precision = 5, scale = 2)
    private BigDecimal peso;
    
    @Column(precision = 3, scale = 2)
    private BigDecimal altura;
    
    @Column(length = 5)
    private String tipoSanguineo;
    
    @Column(columnDefinition = "TEXT")
    private String observacao;

    @Column(columnDefinition = "TEXT")
    private String alergias;

    @Lob
    @Column(name = "foto_url")
    private String fotoUrl;

    @Column(name = "nome_contato_emergencia", length = 150)
    private String nomeContatoEmergencia;

    @Column(name = "contato_emergencia", length = 32)
    private String contatoEmergencia;

    @Column(length = 64)
    private String imc;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cuidador_cpf")
    @JsonIgnoreProperties({"enderecos", "hibernateLazyInitializer", "handler"})
    private Cuidador cuidador;

    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "idoso_id")
    private List<Endereco> enderecos = new ArrayList<>();

    public Idoso() {
    }

    public Idoso(String cpf, String rg, String nome, String email, Date dataNascimento, String telefone, BigDecimal peso, BigDecimal altura, String tipoSanguineo, String observacao, String alergias, String fotoUrl, String nomeContatoEmergencia, String contatoEmergencia, String imc) {
        this.cpf = cpf;
        this.rg = rg;
        this.nome = nome;
        this.email = email;
        this.dataNascimento = dataNascimento;
        this.telefone = telefone;
        this.genero = null;
        this.estadoCivil = null;
        this.idade = null;
    this.peso = peso;
    this.altura = altura;
        this.tipoSanguineo = tipoSanguineo;
        this.observacao = observacao;
        this.alergias = alergias;
        this.fotoUrl = fotoUrl;
        this.nomeContatoEmergencia = nomeContatoEmergencia;
        this.contatoEmergencia = contatoEmergencia;
        this.imc = imc;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getRg() {
        return rg;
    }

    public void setRg(String rg) {
        this.rg = rg;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Date getDataNascimento() {
        return dataNascimento;
    }

    public void setDataNascimento(Date dataNascimento) {
        this.dataNascimento = dataNascimento;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getGenero() {
        return genero;
    }

    public void setGenero(String genero) {
        this.genero = genero;
    }

    public String getEstadoCivil() {
        return estadoCivil;
    }

    public void setEstadoCivil(String estadoCivil) {
        this.estadoCivil = estadoCivil;
    }

    public Integer getIdade() {
        return idade;
    }

    public void setIdade(Integer idade) {
        this.idade = idade;
    }

    public BigDecimal getPeso() {
        return peso;
    }
    
    public void setPeso(BigDecimal peso) {
        this.peso = peso;
    }
    
    public BigDecimal getAltura() {
        return altura;
    }
    
    public void setAltura(BigDecimal altura) {
        this.altura = altura;
    }

    public String getTipoSanguineo() {
        return tipoSanguineo;
    }

    public void setTipoSanguineo(String tipoSanguineo) {
        this.tipoSanguineo = tipoSanguineo;
    }

    public String getObservacao() {
        return observacao;
    }

    public void setObservacao(String observacao) {
        this.observacao = observacao;
    }

    public String getAlergias() {
        return alergias;
    }

    public void setAlergias(String alergias) {
        this.alergias = alergias;
    }

    public String getFotoUrl() {
        return fotoUrl;
    }

    public void setFotoUrl(String fotoUrl) {
        this.fotoUrl = fotoUrl;
    }

    public String getNomeContatoEmergencia() {
        return nomeContatoEmergencia;
    }

    public void setNomeContatoEmergencia(String nomeContatoEmergencia) {
        this.nomeContatoEmergencia = nomeContatoEmergencia;
    }

    public String getContatoEmergencia() {
        return contatoEmergencia;
    }

    public void setContatoEmergencia(String contatoEmergencia) {
        this.contatoEmergencia = contatoEmergencia;
    }

    public List<Endereco> getEnderecos() {
        return enderecos;
    }

    public void setEnderecos(List<Endereco> enderecos) {
        this.enderecos = enderecos;
    }

    public String getImc() {
        if (this.imc != null && !this.imc.isBlank()) {
            return imc;
        }

        if (this.peso == null || this.altura == null || this.altura.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }

        double indice = this.peso.doubleValue() / (this.altura.doubleValue() * this.altura.doubleValue());
        return classifyImc(indice);
    }

    public void setImc(String imc) {
        this.imc = imc;
    }

    public Cuidador getCuidador() {
        return cuidador;
    }

    public void setCuidador(Cuidador cuidador) {
        this.cuidador = cuidador;
    }

    public void setDataNascimento(LocalDate date) {
        if (date == null) {
            this.dataNascimento = null;
            return;
        }
        this.dataNascimento = Date.from(date.atStartOfDay(ZoneId.systemDefault()).toInstant());
    }

    public void setPeso(Double peso) {
        this.peso = peso != null ? BigDecimal.valueOf(peso) : null;
    }

    public void setAltura(Double altura) {
        this.altura = altura != null ? BigDecimal.valueOf(altura) : null;
    }

    public void refreshImc() {
        if (this.peso == null || this.altura == null || this.altura.compareTo(BigDecimal.ZERO) == 0) {
            this.imc = null;
            return;
        }
        double indice = this.peso.doubleValue() / (this.altura.doubleValue() * this.altura.doubleValue());
        this.imc = classifyImc(indice);
    }

    private String classifyImc(double value) {
        String classificacao;

        if (value < 18.5) {
            classificacao = "Abaixo do peso";
        } else if (value < 25) {
            classificacao = "Peso normal";
        } else if (value < 30) {
            classificacao = "Sobrepeso";
        } else if (value < 35) {
            classificacao = "Obesidade grau I";
        } else if (value < 40) {
            classificacao = "Obesidade grau II";
        } else {
            classificacao = "Obesidade grau III (mórbida)";
        }

        return String.format("IMC: %.2f - %s", value, classificacao);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Idoso idoso = (Idoso) o;
        return Objects.equals(cpf, idoso.cpf);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(cpf);
    }

}

