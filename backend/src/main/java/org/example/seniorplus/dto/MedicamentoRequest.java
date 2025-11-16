package org.example.seniorplus.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import lombok.Data;

@Data
public class MedicamentoRequest {
    private String nomeMedicamento;
    private String dosagem;
    private String formaAdministracao;
    private String instrucoes;
    private LocalDate dataInicio;
    private LocalDate dataFim;
    private List<LocalTime> horarios;
    private boolean repetirDiariamente;
    private int intervaloHoras;
    private int intervaloMinutos;
    private String nomeUsuario;
    private String contatoEmergencia;
    private boolean notificarPorEmail;
    private boolean notificarPorApp;
    private boolean notificarPorSms;
}
