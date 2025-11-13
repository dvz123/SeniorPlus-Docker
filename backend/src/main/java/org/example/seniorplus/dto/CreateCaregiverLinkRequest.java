package org.example.seniorplus.dto;

public class CreateCaregiverLinkRequest {
    private String idosoCpf;
    private String mensagem;

    public String getIdosoCpf() {
        return idosoCpf;
    }

    public void setIdosoCpf(String idosoCpf) {
        this.idosoCpf = idosoCpf;
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }
}
