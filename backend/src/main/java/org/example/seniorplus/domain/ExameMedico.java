package org.example.seniorplus.domain;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name = "exames_medicos")
public class ExameMedico extends BaseEntity {
    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String cpf;
    private String tipoExame; // Ex: Hemograma, Raio-X, Eletrocardiograma
    private String resultado;
    private LocalDate dataExame;
    private String laboratorio;
    private String observacoes;

    public ExameMedico() {}

    public ExameMedico(String cpf, String tipoExame, String resultado,
                       LocalDate dataExame, String laboratorio, String observacoes) {
        this.cpf = cpf;
        this.tipoExame = tipoExame;
        this.resultado = resultado;
        this.dataExame = dataExame;
        this.laboratorio = laboratorio;
        this.observacoes = observacoes;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getTipoExame() {
        return tipoExame;
    }

    public void setTipoExame(String tipoExame) {
        this.tipoExame = tipoExame;
    }

    public String getResultado() {
        return resultado;
    }

    public void setResultado(String resultado) {
        this.resultado = resultado;
    }

    public LocalDate getDataExame() {
        return dataExame;
    }

    public void setDataExame(LocalDate dataExame) {
        this.dataExame = dataExame;
    }

    public String getLaboratorio() {
        return laboratorio;
    }

    public void setLaboratorio(String laboratorio) {
        this.laboratorio = laboratorio;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ExameMedico)) return false;
        ExameMedico that = (ExameMedico) o;
        return Objects.equals(cpf, that.cpf) &&
                Objects.equals(tipoExame, that.tipoExame) &&
                Objects.equals(dataExame, that.dataExame);
    }

    @Override
    public int hashCode() {
        return Objects.hash(cpf, tipoExame, dataExame);
    }

}
