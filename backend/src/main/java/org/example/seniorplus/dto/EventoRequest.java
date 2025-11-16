package org.example.seniorplus.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import lombok.Data;

@Data
public class EventoRequest {
    private String titulo;
    private String descricao;
    private LocalDate data;
    private LocalTime horaInicio;
    private LocalTime horaFim;
    private String categoria;
    private String localEvento;
    private String observacoes;
    private String status;
}
