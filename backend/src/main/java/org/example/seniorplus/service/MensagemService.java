package org.example.seniorplus.service;

import org.example.seniorplus.domain.Idoso;
import org.example.seniorplus.domain.Mensagem;
import org.example.seniorplus.dto.MensagemRequest;
import org.example.seniorplus.dto.MensagemResponse;
import org.example.seniorplus.repository.IdosoRepository;
import org.example.seniorplus.repository.MensagemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MensagemService {
    
    @Autowired
    private MensagemRepository mensagemRepository;

    @Autowired
    private IdosoRepository idosoRepository;

    public List<MensagemResponse> getMensagensDoIdoso(String cpf, String id) {
        String cpfResolvido = resolverCpf(cpf, id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o CPF do idoso para buscar mensagens."));

        return mensagemRepository.findByIdosoCpfOrderByDataHoraAsc(cpfResolvido)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public MensagemResponse salvarMensagem(MensagemRequest request) {
        Objects.requireNonNull(request, "Mensagem não pode ser nula");
        String cpf = resolverCpf(request.getIdosoCpf(), request.getIdosoId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF do idoso é obrigatório para enviar mensagens."));

        Idoso idoso = idosoRepository.findById(cpf)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Idoso não encontrado: " + cpf));

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

    private Optional<String> resolverCpf(String cpf, String fallbackId) {
        Optional<String> normalizadoCpf = normalizarCpf(cpf);
        if (normalizadoCpf.isPresent()) {
            return normalizadoCpf;
        }
        return normalizarCpf(fallbackId);
    }

    private Optional<String> normalizarCpf(String cpf) {
        if (cpf == null) {
            return Optional.empty();
        }
        String apenasDigitos = cpf.replaceAll("\\D", "");
        if (apenasDigitos.length() == 11) {
            return Optional.of(apenasDigitos);
        }
        String trimmed = cpf.trim();
        return trimmed.isEmpty() ? Optional.empty() : Optional.of(trimmed);
    }

    private MensagemResponse toResponse(Mensagem mensagem) {
        return new MensagemResponse(
            mensagem.getId(),
            mensagem.getConteudo(),
            mensagem.getRemetente(),
            mensagem.getDestinatario(),
            mensagem.getIdoso() != null ? mensagem.getIdoso().getCpf() : null,
            mensagem.getIdoso() != null ? mensagem.getIdoso().getCpf() : null,
            mensagem.isLida(),
            mensagem.getDataHora()
        );
    }
}