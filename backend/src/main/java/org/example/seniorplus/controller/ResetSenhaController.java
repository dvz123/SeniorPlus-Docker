package org.example.seniorplus.controller;

import lombok.RequiredArgsConstructor;
import org.example.seniorplus.service.ResetSenhaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/reset-senha")
@RequiredArgsConstructor
public class ResetSenhaController {

    private final ResetSenhaService resetSenhaService;

    @PostMapping("/solicitar")
    public ResponseEntity<Void> solicitarResetSenha(@RequestBody Map<String, String> request) throws Exception{
        
            resetSenhaService.solicitarResetSenha(request.get("email"));
            return ResponseEntity.ok().build();
        
    }

    @PostMapping("/resetar")
    public ResponseEntity<Void> resetarSenha(@RequestBody Map<String, String> request) {
        try {
            resetSenhaService.resetarSenha(
                    request.get("token"),
                    request.get("novaSenha")
            );
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
} 