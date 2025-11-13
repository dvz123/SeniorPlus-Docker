package org.example.seniorplus.controller;

import org.example.seniorplus.domain.Mensagem;
import org.example.seniorplus.service.MensagemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mensagens")
@CrossOrigin(origins = "http://localhost:3000")
public class MensagemController {
    
    @Autowired
    private MensagemService mensagemService;

    @GetMapping
    public ResponseEntity<List<Mensagem>> getMensagensDoIdoso(@RequestParam Long idosoId) {
        List<Mensagem> mensagens = mensagemService.getMensagensDoIdoso(idosoId);
        return ResponseEntity.ok(mensagens);
    }

    @PostMapping
    public ResponseEntity<Mensagem> criarMensagem(@RequestBody Mensagem mensagem) {
        Mensagem novaMensagem = mensagemService.salvarMensagem(mensagem);
        return ResponseEntity.ok(novaMensagem);
    }
}