package org.example.seniorplus.domain;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "medicamentos")
public class Medicamento extends BaseEntity {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 14, nullable = false)
    private String cpf;
    
    @Column(nullable = false)
    private String nomeMedicamento;
    
    @Column(nullable = false)
    private String dosagem; // Ex: "500mg", "1 comprimido"
    
    @Column(nullable = false)
    private String formaAdministracao; // Ex: "oral", "injeção"
    
    @Column(columnDefinition = "TEXT")
    private String instrucoes; // Ex: "Tomar após as refeições"

    @Column(nullable = false)
    private LocalDate dataInicio;
    
    private LocalDate dataFim;
    
    @ElementCollection
    @CollectionTable(name = "medicamento_horarios", joinColumns = @JoinColumn(name = "medicamento_id"))
    @Column(name = "horario")
    private List<LocalTime> horarios; // Horários do dia para alertas

    private boolean repetirDiariamente;
    
    private int intervaloHoras;

    @Column(nullable = false)
    private String nomeUsuario;
    
    private String contatoEmergencia;

    private boolean notificarPorEmail;
    private boolean notificarPorApp;
    private boolean notificarPorSms;

    private int intervaloMinutos;


    public Medicamento() {
    }

    public Medicamento(String cpf, String nomeMedicamento, String dosagem, String formaAdministracao, String instrucoes, LocalDate dataInicio, LocalDate dataFim, List<LocalTime> horarios, boolean repetirDiariamente, int intervaloHoras, String nomeUsuario, String contatoEmergencia, boolean notificarPorEmail, boolean notificarPorApp, boolean notificarPorSms, int intervaloMinutos) {
        this.cpf = cpf;
        this.nomeMedicamento = nomeMedicamento;
        this.dosagem = dosagem;
        this.formaAdministracao = formaAdministracao;
        this.instrucoes = instrucoes;
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.horarios = horarios;
        this.repetirDiariamente = repetirDiariamente;
        this.intervaloHoras = intervaloHoras;
        this.nomeUsuario = nomeUsuario;
        this.contatoEmergencia = contatoEmergencia;
        this.notificarPorEmail = notificarPorEmail;
        this.notificarPorApp = notificarPorApp;
        this.notificarPorSms = notificarPorSms;
        this.intervaloMinutos = intervaloMinutos;
    }

    public int getIntervaloMinutos() {
        return intervaloMinutos;
    }

    public void setIntervaloMinutos(int intervaloMinutos) {
        this.intervaloMinutos = intervaloMinutos;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getNomeMedicamento() {
        return nomeMedicamento;
    }

    public void setNomeMedicamento(String nomeMedicamento) {
        this.nomeMedicamento = nomeMedicamento;
    }

    public String getDosagem() {
        return dosagem;
    }

    public void setDosagem(String dosagem) {
        this.dosagem = dosagem;
    }

    public String getFormaAdministracao() {
        return formaAdministracao;
    }

    public void setFormaAdministracao(String formaAdministracao) {
        this.formaAdministracao = formaAdministracao;
    }

    public String getInstrucoes() {
        return instrucoes;
    }

    public void setInstrucoes(String instrucoes) {
        this.instrucoes = instrucoes;
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


    public boolean isRepetirDiariamente() {
        return repetirDiariamente;
    }

    public void setRepetirDiariamente(boolean repetirDiariamente) {
        this.repetirDiariamente = repetirDiariamente;
    }

    public int getIntervaloHoras() {
        return intervaloHoras;
    }

    public void setIntervaloHoras(int intervaloHoras) {
        this.intervaloHoras = intervaloHoras;
    }

    public String getNomeUsuario() {
        return nomeUsuario;
    }

    public void setNomeUsuario(String nomeUsuario) {
        this.nomeUsuario = nomeUsuario;
    }

    public String getContatoEmergencia() {
        return contatoEmergencia;
    }

    public void setContatoEmergencia(String contatoEmergencia) {
        this.contatoEmergencia = contatoEmergencia;
    }

    public boolean isNotificarPorEmail() {
        return notificarPorEmail;
    }

    public void setNotificarPorEmail(boolean notificarPorEmail) {
        this.notificarPorEmail = notificarPorEmail;
    }

    public boolean isNotificarPorApp() {
        return notificarPorApp;
    }

    public void setNotificarPorApp(boolean notificarPorApp) {
        this.notificarPorApp = notificarPorApp;
    }

    public boolean isNotificarPorSms() {
        return notificarPorSms;
    }

    public void setNotificarPorSms(boolean notificarPorSms) {
        this.notificarPorSms = notificarPorSms;
    }



    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Medicamento that = (Medicamento) o;
        return Objects.equals(cpf, that.cpf);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(cpf);
    }

    public List<LocalTime> gerarHorariosNasProximas2Horas() {
        List<LocalTime> proximosHorarios = new java.util.ArrayList<>();
        LocalTime agora = LocalTime.now().withSecond(0).withNano(0);
        LocalTime fim = agora.plusHours(2);

        // Use uma variável local para garantir o tipo
        List<LocalTime> listaHorarios = this.horarios != null ? this.horarios : List.of();

        for (LocalTime base : listaHorarios) {
            LocalTime horario = base;
            while (horario.isBefore(fim)) {
                if (!horario.isBefore(agora)) {
                    proximosHorarios.add(horario);
                }
                horario = horario.plusMinutes(this.intervaloMinutos);
            }
        }
        return proximosHorarios;
    }
}
