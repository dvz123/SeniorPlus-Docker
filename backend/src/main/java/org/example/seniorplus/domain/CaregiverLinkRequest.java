package org.example.seniorplus.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "caregiver_link_requests")
public class CaregiverLinkRequest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "idoso_cpf", length = 14, nullable = false)
    private String idosoCpf;

    @Column(name = "cuidador_cpf", length = 14, nullable = false)
    private String cuidadorCpf;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CaregiverLinkStatus status = CaregiverLinkStatus.PENDING;

    @Column(length = 255)
    private String mensagem;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

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

    public CaregiverLinkStatus getStatus() {
        return status;
    }

    public void setStatus(CaregiverLinkStatus status) {
        this.status = status;
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }

    public LocalDateTime getRespondedAt() {
        return respondedAt;
    }

    public void setRespondedAt(LocalDateTime respondedAt) {
        this.respondedAt = respondedAt;
    }
}
