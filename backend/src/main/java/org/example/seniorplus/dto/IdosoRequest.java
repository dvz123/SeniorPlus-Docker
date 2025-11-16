package org.example.seniorplus.dto;

import lombok.Data;

@Data
public class IdosoRequest {
    private String cpf;
    private String rg;
    private String nome;
    private String email;
    private String dataNascimento;
    private String telefone;
    private Integer idade;
    private String genero;
    private String estadoCivil;
    private Double peso;
    private Double altura;
    private String tipoSanguineo;
    private String observacao;
    private String alergias;
    private String fotoUrl;
    private String nomeContatoEmergencia;
    private String contatoEmergencia;
    private String imc;
    private String cuidadorCpf;
}
