package org.example.seniorplus.controller;

import org.example.seniorplus.domain.Cuidador;
import org.example.seniorplus.domain.Idoso;
import org.example.seniorplus.domain.Role;
import org.example.seniorplus.domain.Usuario;
import org.example.seniorplus.dto.CaregiverLinkRequest;
import org.example.seniorplus.dto.IdosoRequest;
import org.example.seniorplus.repository.UsuarioRepository;
import org.example.seniorplus.service.IdosoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

@RestController
@RequestMapping("/api/v1/idoso")
public class IdosoController {

    @Autowired
    private IdosoService idosoService;

    @Autowired
    private UsuarioRepository usuarioRepository;

   @GetMapping
    public ResponseEntity<List<Idoso>> findAll() {
       List<Idoso> idosos = idosoService.buscarTodos();
       return ResponseEntity.ok().body(idosos);
   }

    @GetMapping(value = "/{cpf}")
    public ResponseEntity<Idoso> findById(@PathVariable String cpf) {
        Idoso find = idosoService.buscarPorCpf(cpf);
        return find != null ? ResponseEntity.ok(find) : ResponseEntity.notFound().build();
    }

    @GetMapping("/cuidador/{cpf}")
    public ResponseEntity<List<Idoso>> findByCaregiver(@PathVariable String cpf) {
        List<Idoso> vinculados = idosoService.buscarPorCuidadorCpf(cpf);
        return ResponseEntity.ok(vinculados);
    }

    @GetMapping("/informacoesIdoso")
    public ResponseEntity<Idoso> getCurrentElderly(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(principal.getName());
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Usuario usuario = usuarioOpt.get();
        Role role = usuario.getRole();

        if (role == Role.ROLE_IDOSO) {
            Idoso idoso = idosoService.buscarPorCpf(usuario.getCpf());
            return ResponseEntity.ok(idoso);
        }

        if (role == Role.ROLE_CUIDADOR) {
            List<Idoso> vinculados = idosoService.buscarPorCuidadorCpf(usuario.getCpf());
            if (vinculados.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(vinculados.get(0));
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @PostMapping
    public ResponseEntity<Idoso> save(@RequestBody IdosoRequest request) {
        Idoso entity = mapToEntity(request);
        Idoso saved = idosoService.criar(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping(value = "/{cpf}")
    public ResponseEntity<Idoso> update(@PathVariable String cpf, @RequestBody IdosoRequest request) {
        Idoso entity = mapToEntity(request);
        Idoso updated = idosoService.atualizar(cpf, entity);
        return ResponseEntity.ok(updated);
    }

    @PutMapping(value = "/{cpf}/cuidador")
    public ResponseEntity<Idoso> linkCaregiver(@PathVariable String cpf, @RequestBody CaregiverLinkRequest request) {
        if (request.getCuidadorCpf() == null || request.getCuidadorCpf().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Idoso updated = idosoService.atribuirCuidador(cpf, request.getCuidadorCpf());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping(value = "/{cpf}/cuidador")
    public ResponseEntity<Idoso> unlinkCaregiver(@PathVariable String cpf) {
        Idoso updated = idosoService.removerCuidador(cpf);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping(value = "/{cpf}")
    public ResponseEntity<Void> delete(@PathVariable String cpf) {
        idosoService.deletar(cpf);
        return ResponseEntity.noContent().build();
    }

    private Idoso mapToEntity(IdosoRequest request) {
        Idoso idoso = new Idoso();

        String cpfNormalizado = normalizarCpf(request.getCpf());
        idoso.setCpf(cpfNormalizado);
        idoso.setRg(request.getRg());
        idoso.setNome(request.getNome());
        idoso.setEmail(request.getEmail());

        if (request.getDataNascimento() != null && !request.getDataNascimento().isBlank()) {
            try {
                LocalDate date = parseDataNascimento(request.getDataNascimento());
                idoso.setDataNascimento(date);
            } catch (DateTimeParseException ex) {
                throw new IllegalArgumentException("Data de nascimento inválida: " + request.getDataNascimento(), ex);
            }
        } else {
            idoso.setDataNascimento((LocalDate) null);
        }

        idoso.setTelefone(request.getTelefone());
        idoso.setGenero(request.getGenero());
        idoso.setEstadoCivil(request.getEstadoCivil());
        idoso.setIdade(request.getIdade());
        idoso.setPeso(request.getPeso());
        idoso.setAltura(request.getAltura());
        idoso.setTipoSanguineo(request.getTipoSanguineo());
        idoso.setObservacao(request.getObservacao());
        idoso.setAlergias(request.getAlergias());
        idoso.setFotoUrl(request.getFotoUrl());
        idoso.setNomeContatoEmergencia(request.getNomeContatoEmergencia());
        idoso.setContatoEmergencia(request.getContatoEmergencia());
        idoso.setImc(request.getImc());

        String cuidadorCpf = normalizarCpf(request.getCuidadorCpf());
        if (cuidadorCpf != null && !cuidadorCpf.isBlank()) {
            Cuidador cuidador = new Cuidador();
            cuidador.setCpf(cuidadorCpf);
            idoso.setCuidador(cuidador);
        }

        return idoso;
    }

    private LocalDate parseDataNascimento(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String trimmed = value.trim();
        DateTimeParseException lastError = null;

        try {
            return LocalDate.parse(trimmed);
        } catch (DateTimeParseException ex) {
            lastError = ex;
        }

        try {
            java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");
            return LocalDate.parse(trimmed, formatter);
        } catch (DateTimeParseException ex) {
            lastError = ex;
        }

        try {
            java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy");
            return LocalDate.parse(trimmed, formatter);
        } catch (DateTimeParseException ex) {
            lastError = ex;
        }

        throw lastError != null ? lastError : new DateTimeParseException("Formato de data inválido", trimmed, 0);
    }

    private String normalizarCpf(String value) {
        if (value == null) {
            return null;
        }
        String digits = value.replaceAll("\\D", "");
        if (digits.length() == 11) {
            return digits;
        }
        return value.trim();
    }

}
