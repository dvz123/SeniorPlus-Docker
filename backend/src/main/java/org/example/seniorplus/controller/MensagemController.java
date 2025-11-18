package org.example.seniorplus.controller;

import org.example.seniorplus.dto.MensagemRequest;
import org.example.seniorplus.dto.MensagemResponse;
import org.example.seniorplus.service.MensagemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/mensagens")
public class MensagemController {
    
    @Autowired
    private MensagemService mensagemService;

    @GetMapping
    public ResponseEntity<List<MensagemResponse>> getMensagensDoIdoso(
            @RequestParam(value = "idosoCpf", required = false) String cpf,
            @RequestParam(value = "idosoId", required = false) String id) {

        List<MensagemResponse> mensagens = mensagemService.getMensagensDoIdoso(cpf, id);
        return ResponseEntity.ok(mensagens);
    }

    @PostMapping
    public ResponseEntity<MensagemResponse> criarMensagem(@RequestBody MensagemRequest request) {
        MensagemResponse novaMensagem = mensagemService.salvarMensagem(request);
        return ResponseEntity.status(201).body(novaMensagem);
    }
}