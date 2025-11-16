package org.example.seniorplus.service;

import org.example.seniorplus.domain.Idoso;
import org.example.seniorplus.domain.Mensagem;
import org.example.seniorplus.dto.MensagemRequest;
import org.example.seniorplus.dto.MensagemResponse;
import org.example.seniorplus.repository.IdosoRepository;
import org.example.seniorplus.repository.MensagemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class MensagemService {
    
    @Autowired
    private MensagemRepository mensagemRepository;

    @Autowired
    private IdosoRepository idosoRepository;

    public List<MensagemResponse> getMensagensDoIdoso(String cpf) {
        String normalizado = normalizarCpf(cpf);
        return mensagemRepository.findByIdosoCpfOrderByDataHoraAsc(normalizado)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public MensagemResponse salvarMensagem(MensagemRequest request) {
        Objects.requireNonNull(request, "Mensagem não pode ser nula");
        String cpf = normalizarCpf(request.getIdosoCpf());
        Objects.requireNonNull(cpf, "CPF normalizado não pode ser nulo");
        Idoso idoso = idosoRepository.findById(cpf)
            .orElseThrow(() -> new IllegalArgumentException("Idoso não encontrado: " + cpf));

        Mensagem mensagem = new Mensagem();
        mensagem.setConteudo(request.getConteudo());
        mensagem.setRemetente(request.getRemetente());
        mensagem.setDestinatario(request.getDestinatario());
        mensagem.setIdoso(idoso);
        mensagem.setLida(Boolean.TRUE.equals(request.getLida()));
        mensagem.setDataHora(LocalDateTime.now());

        Mensagem salvo = mensagemRepository.save(mensagem);
        return toResponse(salvo);
    }

    private String normalizarCpf(String cpf) {
        Objects.requireNonNull(cpf, "CPF não pode ser nulo");
        String apenasDigitos = cpf.replaceAll("\\D", "");
        if (apenasDigitos.length() == 11) {
            return apenasDigitos;
        }
        return cpf.trim();
    }

    private MensagemResponse toResponse(Mensagem mensagem) {
        return new MensagemResponse(
            mensagem.getId(),
            mensagem.getConteudo(),
            mensagem.getRemetente(),
            mensagem.getDestinatario(),
            mensagem.getIdoso() != null ? mensagem.getIdoso().getCpf() : null,
            mensagem.isLida(),
            mensagem.getDataHora()
        );
    }
}