package org.example.seniorplus.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "eventos")
public class Evento extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 255)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "data")
    private java.time.LocalDate data;

    @Column(name = "hora_inicio")
    private java.time.LocalTime horaInicio;

    @Column(name = "hora_fim")
    private java.time.LocalTime horaFim;

    @Column(name = "data_hora")
    private LocalDateTime dataHora;

    @Column(length = 50)
    private String status;

    @Column(name = "local_evento", length = 255)
    private String localEvento;

    @Column(length = 60)
    private String categoria;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idoso_id", referencedColumnName = "cpf")
    private Idoso idoso;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public java.time.LocalDate getData() {
        return data;
    }

    public void setData(java.time.LocalDate data) {
        this.data = data;
        recomputeDataHora();
    }

    public java.time.LocalTime getHoraInicio() {
        return horaInicio;
    }

    public void setHoraInicio(java.time.LocalTime horaInicio) {
        this.horaInicio = horaInicio;
        recomputeDataHora();
    }

    public java.time.LocalTime getHoraFim() {
        return horaFim;
    }

    public void setHoraFim(java.time.LocalTime horaFim) {
        this.horaFim = horaFim;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public void setDataHora(LocalDateTime dataHora) {
        this.dataHora = dataHora;
        if (dataHora != null) {
            this.data = dataHora.toLocalDate();
            this.horaInicio = dataHora.toLocalTime();
        }
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getLocalEvento() {
        return localEvento;
    }

    public void setLocalEvento(String localEvento) {
        this.localEvento = localEvento;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public Idoso getIdoso() {
        return idoso;
    }

    public void setIdoso(Idoso idoso) {
        this.idoso = idoso;
    }

    private void recomputeDataHora() {
        if (this.data != null && this.horaInicio != null) {
            this.dataHora = LocalDateTime.of(this.data, this.horaInicio);
        }
    }
}
