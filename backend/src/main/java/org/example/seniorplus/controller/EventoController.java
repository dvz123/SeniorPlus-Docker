package org.example.seniorplus.controller;

import org.example.seniorplus.domain.Evento;
import org.example.seniorplus.service.EventoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/eventos")
@CrossOrigin(origins = "http://localhost:3000")
public class EventoController {
    
    @Autowired
    private EventoService eventoService;

    @GetMapping("/hoje")
    public ResponseEntity<List<Evento>> getEventosDeHoje(@RequestParam Long idosoId) {
        List<Evento> eventos = eventoService.getEventosDeHoje(idosoId);
        return ResponseEntity.ok(eventos);
    }

    @PostMapping
    public ResponseEntity<Evento> criarEvento(@RequestBody Evento evento) {
        Evento novoEvento = eventoService.salvarEvento(evento);
        return ResponseEntity.ok(novoEvento);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> atualizarStatusEvento(
            @PathVariable Long id,
            @RequestBody Map<String, String> status) {
        eventoService.atualizarStatusEvento(id, status.get("status"));
        return ResponseEntity.ok().build();
    }
}