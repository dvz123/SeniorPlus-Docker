package org.example.seniorplus.controller;

import java.util.List;

import org.example.seniorplus.domain.ContatoEmergencia;
import org.example.seniorplus.service.ContatoEmergenciaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/idosos/{cpf}/contatos-emergencia")
public class ContatoEmergenciaController {

    @Autowired
    private ContatoEmergenciaService service;

    @GetMapping
    public ResponseEntity<List<ContatoEmergencia>> listar(@PathVariable String cpf) {
        return ResponseEntity.ok(service.listarPorCpf(cpf));
    }

    @PostMapping
    public ResponseEntity<ContatoEmergencia> criar(@PathVariable String cpf, @RequestBody ContatoEmergencia contato) {
        ContatoEmergencia salvo = service.salvar(cpf, contato);
        return ResponseEntity.status(201).body(salvo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContatoEmergencia> atualizar(
            @PathVariable String cpf,
            @PathVariable Long id,
            @RequestBody ContatoEmergencia contato) {
        return ResponseEntity.ok(service.atualizar(cpf, id, contato));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable String cpf, @PathVariable Long id) {
        service.remover(cpf, id);
        return ResponseEntity.noContent().build();
    }
}
