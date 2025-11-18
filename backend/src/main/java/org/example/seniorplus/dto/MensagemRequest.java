package org.example.seniorplus.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MensagemRequest {
    private String conteudo;
    private String remetente;
    private String destinatario;
    private String idosoCpf;
    private String idosoId;
    private Boolean lida;
}
