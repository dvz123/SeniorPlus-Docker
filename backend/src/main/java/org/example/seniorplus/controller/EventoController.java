package org.example.seniorplus.controller;

import java.util.List;
import java.util.Map;

import org.example.seniorplus.domain.Evento;
import org.example.seniorplus.dto.EventoRequest;
import org.example.seniorplus.service.EventoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class EventoController {

    @Autowired
    private EventoService eventoService;

    @GetMapping("/idosos/{cpf}/eventos")
    public ResponseEntity<List<Evento>> listarEventos(@PathVariable String cpf) {
        return ResponseEntity.ok(eventoService.listarEventos(cpf));
    }

    @GetMapping("/idosos/{cpf}/eventos/hoje")
    public ResponseEntity<List<Evento>> listarEventosDeHoje(@PathVariable String cpf) {
        return ResponseEntity.ok(eventoService.listarEventosDeHoje(cpf));
    }

    @PostMapping("/idosos/{cpf}/eventos")
    public ResponseEntity<Evento> criarEvento(@PathVariable String cpf, @RequestBody EventoRequest request) {
        Evento salvo = eventoService.salvarEvento(cpf, toEvento(request));
        return ResponseEntity.status(201).body(salvo);
    }

    @PutMapping("/eventos/{id}")
    public ResponseEntity<Evento> atualizarEvento(@PathVariable Long id, @RequestBody EventoRequest request) {
        Evento atualizado = eventoService.atualizarEvento(id, toEvento(request));
        return ResponseEntity.ok(atualizado);
    }

    @PatchMapping("/eventos/{id}/status")
    public ResponseEntity<Void> atualizarStatusEvento(@PathVariable Long id, @RequestBody Map<String, String> status) {
        eventoService.atualizarStatusEvento(id, status.getOrDefault("status", "PENDENTE"));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/eventos/{id}")
    public ResponseEntity<Void> deletarEvento(@PathVariable Long id) {
        eventoService.deletarEvento(id);
        return ResponseEntity.noContent().build();
    }

    private Evento toEvento(EventoRequest request) {
        Evento evento = new Evento();
        evento.setTitulo(request.getTitulo());
        evento.setDescricao(request.getDescricao());
        evento.setData(request.getData());
        evento.setHoraInicio(request.getHoraInicio());
        evento.setHoraFim(request.getHoraFim());
        evento.setCategoria(request.getCategoria());
        evento.setLocalEvento(request.getLocalEvento());
        evento.setObservacoes(request.getObservacoes());
        evento.setStatus(request.getStatus());
        return evento;
    }
}