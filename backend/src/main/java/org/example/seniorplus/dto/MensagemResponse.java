package org.example.seniorplus.dto;

import java.time.LocalDateTime;

public class MensagemResponse {
    private Long id;
    private String conteudo;
    private String remetente;
    private String destinatario;
    private String idosoCpf;
    private boolean lida;
    private LocalDateTime dataHora;

    public MensagemResponse() {}

    public MensagemResponse(Long id, String conteudo, String remetente, String destinatario,
                            String idosoCpf, boolean lida, LocalDateTime dataHora) {
        this.id = id;
        this.conteudo = conteudo;
        this.remetente = remetente;
        this.destinatario = destinatario;
        this.idosoCpf = idosoCpf;
        this.lida = lida;
        this.dataHora = dataHora;
    }

    public Long getId() { return id; }
    public String getConteudo() { return conteudo; }
    public String getRemetente() { return remetente; }
    public String getDestinatario() { return destinatario; }
    public String getIdosoCpf() { return idosoCpf; }
    public boolean isLida() { return lida; }
    public LocalDateTime getDataHora() { return dataHora; }

    public void setId(Long id) { this.id = id; }
    public void setConteudo(String conteudo) { this.conteudo = conteudo; }
    public void setRemetente(String remetente) { this.remetente = remetente; }
    public void setDestinatario(String destinatario) { this.destinatario = destinatario; }
    public void setIdosoCpf(String idosoCpf) { this.idosoCpf = idosoCpf; }
    public void setLida(boolean lida) { this.lida = lida; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }
}
