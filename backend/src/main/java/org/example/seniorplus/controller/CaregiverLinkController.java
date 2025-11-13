package org.example.seniorplus.controller;

import org.example.seniorplus.domain.CaregiverLinkRequest;
import org.example.seniorplus.domain.Role;
import org.example.seniorplus.domain.Usuario;
import org.example.seniorplus.dto.CaregiverLinkRequestDto;
import org.example.seniorplus.dto.CreateCaregiverLinkRequest;
import org.example.seniorplus.dto.RespondCaregiverLinkRequest;
import org.example.seniorplus.repository.UsuarioRepository;
import org.example.seniorplus.service.CaregiverLinkService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/vinculos")
public class CaregiverLinkController {

    private final CaregiverLinkService linkService;
    private final UsuarioRepository usuarioRepository;

    public CaregiverLinkController(CaregiverLinkService linkService, UsuarioRepository usuarioRepository) {
        this.linkService = linkService;
        this.usuarioRepository = usuarioRepository;
    }

    @PostMapping("/solicitacoes")
    public ResponseEntity<CaregiverLinkRequestDto> solicitarVinculo(@RequestBody CreateCaregiverLinkRequest request,
                                                                    Principal principal) {
        Usuario usuario = resolverUsuario(principal);
        if (usuario.getRole() != Role.ROLE_CUIDADOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas cuidadores podem solicitar vínculos.");
        }

        try {
            CaregiverLinkRequest criado = linkService.solicitarVinculo(usuario.getCpf(), request.getIdosoCpf(), request.getMensagem());
            return ResponseEntity.status(HttpStatus.CREATED).body(linkService.mapearDto(criado));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, ex.getMessage(), ex);
        }
    }

    @GetMapping("/solicitacoes")
    public ResponseEntity<List<CaregiverLinkRequestDto>> listarSolicitacoes(Principal principal) {
        Usuario usuario = resolverUsuario(principal);
        if (usuario.getRole() == Role.ROLE_IDOSO) {
            List<CaregiverLinkRequestDto> pendentes = linkService.listarPendentesParaIdoso(usuario.getCpf());
            return ResponseEntity.ok(pendentes);
        }

        if (usuario.getRole() == Role.ROLE_CUIDADOR) {
            List<CaregiverLinkRequestDto> solicitacoes = linkService.listarSolicitacoesDoCuidador(usuario.getCpf());
            return ResponseEntity.ok(solicitacoes);
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Perfil sem permissão para esta operação.");
    }

    @PostMapping("/solicitacoes/{id}/responder")
    public ResponseEntity<CaregiverLinkRequestDto> responderSolicitacao(@PathVariable Long id,
                                                                        @RequestBody RespondCaregiverLinkRequest body,
                                                                        Principal principal) {
        Usuario usuario = resolverUsuario(principal);
        if (usuario.getRole() != Role.ROLE_IDOSO) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas idosos podem responder solicitações.");
        }

        String acao = body.getAcao();
        if (acao == null || acao.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a ação desejada (aceitar ou recusar).");
        }

        boolean aceitar;
        if ("aceitar".equalsIgnoreCase(acao) || "accept".equalsIgnoreCase(acao)) {
            aceitar = true;
        } else if ("recusar".equalsIgnoreCase(acao) || "reject".equalsIgnoreCase(acao)) {
            aceitar = false;
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ação inválida. Use 'aceitar' ou 'recusar'.");
        }

        try {
            CaregiverLinkRequest atualizado = linkService.responderSolicitacao(id, usuario.getCpf(), aceitar);
            return ResponseEntity.ok(linkService.mapearDto(atualizado));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, ex.getMessage(), ex);
        }
    }

    private Usuario resolverUsuario(Principal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }

        return usuarioRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não encontrado."));
    }
}
