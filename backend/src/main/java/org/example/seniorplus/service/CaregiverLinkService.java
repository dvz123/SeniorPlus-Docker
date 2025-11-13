package org.example.seniorplus.service;

import org.example.seniorplus.domain.CaregiverLinkRequest;
import org.example.seniorplus.domain.CaregiverLinkStatus;
import org.example.seniorplus.domain.Cuidador;
import org.example.seniorplus.domain.Idoso;
import org.example.seniorplus.domain.Role;
import org.example.seniorplus.domain.Usuario;
import org.example.seniorplus.dto.CaregiverLinkRequestDto;
import org.example.seniorplus.repository.CaregiverLinkRequestRepository;
import org.example.seniorplus.repository.CuidadorRepository;
import org.example.seniorplus.repository.IdosoRepository;
import org.example.seniorplus.repository.UsuarioRepository;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CaregiverLinkService {

    private final CaregiverLinkRequestRepository requestRepository;
    private final IdosoRepository idosoRepository;
    private final CuidadorRepository cuidadorRepository;
    private final UsuarioRepository usuarioRepository;
    private final IdosoService idosoService;

    public CaregiverLinkService(CaregiverLinkRequestRepository requestRepository,
                                IdosoRepository idosoRepository,
                                CuidadorRepository cuidadorRepository,
                                UsuarioRepository usuarioRepository,
                                IdosoService idosoService) {
        this.requestRepository = requestRepository;
        this.idosoRepository = idosoRepository;
        this.cuidadorRepository = cuidadorRepository;
        this.usuarioRepository = usuarioRepository;
        this.idosoService = idosoService;
    }

    @Transactional
    public CaregiverLinkRequest solicitarVinculo(String cuidadorCpf, String idosoCpf, String mensagem) {
        if (idosoCpf == null || cuidadorCpf == null) {
            throw new IllegalArgumentException("CPF do idoso e do cuidador são obrigatórios.");
        }

        String cuidadorCpfNormalizado = normalizarCpf(cuidadorCpf);
        String idosoCpfNormalizado = normalizarCpf(idosoCpf);

        if (!cpfValido(cuidadorCpfNormalizado) || !cpfValido(idosoCpfNormalizado)) {
            throw new IllegalArgumentException("Informe CPFs válidos com 11 dígitos.");
        }

        Idoso idoso = garantirRegistroIdoso(idosoCpfNormalizado, idosoCpf);

        if (idoso.getCuidador() != null) {
            throw new IllegalStateException("Este idoso já possui um cuidador vinculado.");
        }

        Cuidador cuidador = garantirRegistroCuidador(cuidadorCpfNormalizado, cuidadorCpf);

        Optional<CaregiverLinkRequest> existente = requestRepository
                .findTopByIdosoCpfAndCuidadorCpfAndStatus(idoso.getCpf(), cuidador.getCpf(), CaregiverLinkStatus.PENDING);
        if (existente.isPresent()) {
            CaregiverLinkRequest atual = existente.get();
            atual.setMensagem(mensagem);
            return requestRepository.save(atual);
        }

        CaregiverLinkRequest request = new CaregiverLinkRequest();
        request.setIdosoCpf(idoso.getCpf());
        request.setCuidadorCpf(cuidador.getCpf());
        request.setMensagem(mensagem);
        request.setStatus(CaregiverLinkStatus.PENDING);
        return requestRepository.save(request);
    }

    @Transactional(readOnly = true)
    public List<CaregiverLinkRequestDto> listarPendentesParaIdoso(String idosoCpf) {
        return buscarSolicitacoesPorIdosoEStatus(idosoCpf, CaregiverLinkStatus.PENDING)
                .stream()
                .map(this::mapearDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CaregiverLinkRequestDto> listarSolicitacoesDoCuidador(String cuidadorCpf) {
        return buscarSolicitacoesParaCuidador(cuidadorCpf)
                .stream()
                .map(this::mapearDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CaregiverLinkRequest responderSolicitacao(Long id, String idosoCpf, boolean aceitar) {
    CaregiverLinkRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new EmptyResultDataAccessException("Solicitação não encontrada", 1));

        if (!CaregiverLinkStatus.PENDING.equals(request.getStatus())) {
            throw new IllegalStateException("A solicitação já foi respondida.");
        }

        if (!request.getIdosoCpf().equals(idosoCpf)) {
            throw new IllegalStateException("Esta solicitação não pertence ao idoso informado.");
        }

        if (aceitar) {
            idosoService.atribuirCuidador(idosoCpf, request.getCuidadorCpf());
            request.setStatus(CaregiverLinkStatus.ACCEPTED);
            cancelarOutrasSolicitacoesPendentes(idosoCpf, request.getId());
        } else {
            request.setStatus(CaregiverLinkStatus.REJECTED);
        }

        request.setRespondedAt(LocalDateTime.now());
        return requestRepository.save(request);
    }

    private void cancelarOutrasSolicitacoesPendentes(String idosoCpf, Long solicitacaoAceitaId) {
        List<CaregiverLinkRequest> pendentes = buscarSolicitacoesPorIdosoEStatus(idosoCpf, CaregiverLinkStatus.PENDING);
        for (CaregiverLinkRequest solicitacao : pendentes) {
            if (!solicitacao.getId().equals(solicitacaoAceitaId)) {
                solicitacao.setStatus(CaregiverLinkStatus.REJECTED);
                solicitacao.setRespondedAt(LocalDateTime.now());
                requestRepository.save(solicitacao);
            }
        }
    }

    @Transactional(readOnly = true)
    public CaregiverLinkRequestDto mapearDto(CaregiverLinkRequest entity) {
        CaregiverLinkRequestDto dto = new CaregiverLinkRequestDto();
        dto.setId(entity.getId());
        dto.setCuidadorCpf(entity.getCuidadorCpf());
        dto.setIdosoCpf(entity.getIdosoCpf());
        dto.setStatus(entity.getStatus());
        dto.setMensagem(entity.getMensagem());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setRespondedAt(entity.getRespondedAt());

        cuidadorRepository.findById(entity.getCuidadorCpf())
                .map(Cuidador::getNome)
                .ifPresent(dto::setCuidadorNome);

        idosoRepository.findById(entity.getIdosoCpf())
                .map(Idoso::getNome)
                .ifPresent(dto::setIdosoNome);

        return dto;
    }

    private String normalizarCpf(String cpf) {
        if (cpf == null) {
            return null;
        }
        String apenasDigitos = cpf.replaceAll("\\D", "");
        if (apenasDigitos.length() == 11) {
            return apenasDigitos;
        }
        return cpf.trim();
    }

    private boolean cpfValido(String cpf) {
        return cpf != null && cpf.matches("\\d{11}");
    }

    private Idoso garantirRegistroIdoso(String cpfNormalizado, String cpfOriginal) {
        return buscarIdosoPorCpf(cpfNormalizado)
                .or(() -> buscarIdosoPorCpf(cpfOriginal))
                .orElseGet(() -> criarIdosoComBaseEmUsuario(cpfNormalizado, cpfOriginal));
    }

    private Cuidador garantirRegistroCuidador(String cpfNormalizado, String cpfOriginal) {
        return buscarCuidadorPorCpf(cpfNormalizado)
                .or(() -> buscarCuidadorPorCpf(cpfOriginal))
                .orElseGet(() -> criarCuidadorComBaseEmUsuario(cpfNormalizado, cpfOriginal));
    }

    private Optional<Idoso> buscarIdosoPorCpf(String cpf) {
        if (cpf == null || cpf.isBlank()) {
            return Optional.empty();
        }
        return idosoRepository.findById(cpf);
    }

    private Optional<Cuidador> buscarCuidadorPorCpf(String cpf) {
        if (cpf == null || cpf.isBlank()) {
            return Optional.empty();
        }
        return cuidadorRepository.findById(cpf);
    }

    private Optional<Usuario> localizarUsuarioPorCpf(String cpfNormalizado, String cpfOriginal) {
        if (cpfNormalizado != null && !cpfNormalizado.isBlank()) {
            Optional<Usuario> encontrado = usuarioRepository.findByCpf(cpfNormalizado);
            if (encontrado.isPresent()) {
                return encontrado;
            }
        }
        if (cpfOriginal != null && !cpfOriginal.isBlank() && !cpfOriginal.equals(cpfNormalizado)) {
            return usuarioRepository.findByCpf(cpfOriginal);
        }
        return Optional.empty();
    }

    private Idoso criarIdosoComBaseEmUsuario(String cpfNormalizado, String cpfOriginal) {
        Usuario usuario = localizarUsuarioPorCpf(cpfNormalizado, cpfOriginal)
                .filter(u -> u.getRole() == Role.ROLE_IDOSO)
                .orElseThrow(() -> new EmptyResultDataAccessException("Idoso não encontrado para CPF " + (cpfOriginal != null ? cpfOriginal : cpfNormalizado), 1));

        Idoso novo = new Idoso();
        novo.setCpf(usuario.getCpf());
        String nome = Optional.ofNullable(usuario.getNome()).filter(n -> !n.isBlank()).orElse("Idoso");
        novo.setNome(nome);
        novo.setEmail(usuario.getEmail());

        return idosoService.criar(novo);
    }

    private Cuidador criarCuidadorComBaseEmUsuario(String cpfNormalizado, String cpfOriginal) {
        Usuario usuario = localizarUsuarioPorCpf(cpfNormalizado, cpfOriginal)
                .filter(u -> u.getRole() == Role.ROLE_CUIDADOR)
                .orElseThrow(() -> new EmptyResultDataAccessException("Cuidador não encontrado para CPF " + (cpfOriginal != null ? cpfOriginal : cpfNormalizado), 1));

        Cuidador novo = new Cuidador();
        novo.setCpf(usuario.getCpf());
        String nome = Optional.ofNullable(usuario.getNome()).filter(n -> !n.isBlank()).orElse("Cuidador");
        novo.setNome(nome);
        novo.setEmail(usuario.getEmail());

        return cuidadorRepository.save(novo);
    }

    private List<CaregiverLinkRequest> buscarSolicitacoesPorIdosoEStatus(String cpf, CaregiverLinkStatus status) {
        if (cpf == null || cpf.isBlank()) {
            return List.of();
        }

        String normalizado = normalizarCpf(cpf);
        List<CaregiverLinkRequest> principal = requestRepository.findByIdosoCpfAndStatusOrderByCreatedAtDesc(normalizado, status);

        if (normalizado == null || normalizado.isBlank() || normalizado.equals(cpf)) {
            return principal;
        }

        List<CaregiverLinkRequest> alternativo = requestRepository.findByIdosoCpfAndStatusOrderByCreatedAtDesc(cpf, status);
        return combinarSolicitacoes(principal, alternativo);
    }

    private List<CaregiverLinkRequest> buscarSolicitacoesParaCuidador(String cpf) {
        if (cpf == null || cpf.isBlank()) {
            return List.of();
        }

        String normalizado = normalizarCpf(cpf);
        List<CaregiverLinkRequest> principal = requestRepository.findByCuidadorCpfOrderByCreatedAtDesc(normalizado);

        if (normalizado == null || normalizado.isBlank() || normalizado.equals(cpf)) {
            return principal;
        }

        List<CaregiverLinkRequest> alternativo = requestRepository.findByCuidadorCpfOrderByCreatedAtDesc(cpf);
        return combinarSolicitacoes(principal, alternativo);
    }

    private List<CaregiverLinkRequest> combinarSolicitacoes(List<CaregiverLinkRequest> principal,
                                                            List<CaregiverLinkRequest> alternativo) {
        Map<Long, CaregiverLinkRequest> agrupado = new LinkedHashMap<>();
        if (principal != null) {
            for (CaregiverLinkRequest item : principal) {
                agrupado.put(item.getId(), item);
            }
        }
        if (alternativo != null) {
            for (CaregiverLinkRequest item : alternativo) {
                agrupado.putIfAbsent(item.getId(), item);
            }
        }
        return new ArrayList<>(agrupado.values());
    }
}
