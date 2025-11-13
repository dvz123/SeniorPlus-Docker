package org.example.seniorplus.dto;

import org.example.seniorplus.domain.CaregiverLinkStatus;

import java.time.LocalDateTime;

public class CaregiverLinkRequestDto {
    private Long id;
    private String idosoCpf;
    private String cuidadorCpf;
    private String cuidadorNome;
    private String idosoNome;
    private CaregiverLinkStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;
    private String mensagem;

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

    public String getCuidadorCpf() {
        return cuidadorCpf;
    }

    public void setCuidadorCpf(String cuidadorCpf) {
        this.cuidadorCpf = cuidadorCpf;
    }

    public String getCuidadorNome() {
        return cuidadorNome;
    }

    public void setCuidadorNome(String cuidadorNome) {
        this.cuidadorNome = cuidadorNome;
    }

    public String getIdosoNome() {
        return idosoNome;
    }

    public void setIdosoNome(String idosoNome) {
        this.idosoNome = idosoNome;
    }

    public CaregiverLinkStatus getStatus() {
        return status;
    }

    public void setStatus(CaregiverLinkStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getRespondedAt() {
        return respondedAt;
    }

    public void setRespondedAt(LocalDateTime respondedAt) {
        this.respondedAt = respondedAt;
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }
}
