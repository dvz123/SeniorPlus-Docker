package org.example.seniorplus.dto;

import lombok.Data;

@Data
public class MensagemRequest {
    private String conteudo;
    private String remetente;
    private String destinatario;
    private String idosoCpf;
    private Boolean lida;
}
