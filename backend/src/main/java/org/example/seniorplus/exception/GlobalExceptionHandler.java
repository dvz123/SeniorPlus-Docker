package org.example.seniorplus.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthenticationException(AuthenticationException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("erro", ex.getMessage());
        response.put("tipo", "AUTENTICACAO");
        response.put("status", HttpStatus.UNAUTHORIZED.value());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentialsException(BadCredentialsException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("erro", "Email ou senha inválidos");
        response.put("tipo", "CREDENCIAIS_INVALIDAS");
        response.put("status", HttpStatus.UNAUTHORIZED.value());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        Map<String, Object> response = new HashMap<>();
        
        // Mensagens específicas para erros comuns
        String mensagem = ex.getMessage();
        String tipo = "ERRO_GERAL";
        HttpStatus status = HttpStatus.BAD_REQUEST;
        
        if (mensagem != null) {
            if (mensagem.contains("Email já cadastrado")) {
                tipo = "EMAIL_DUPLICADO";
                mensagem = "Este email já está cadastrado. Por favor, use outro email ou faça login.";
            } else if (mensagem.contains("Usuário não encontrado")) {
                tipo = "USUARIO_NAO_ENCONTRADO";
                mensagem = "Usuário não encontrado.";
                status = HttpStatus.NOT_FOUND;
            } else if (mensagem.contains("Usuário ou senha inválidos")) {
                tipo = "CREDENCIAIS_INVALIDAS";
                mensagem = "Email ou senha incorretos.";
                status = HttpStatus.UNAUTHORIZED;
            } else if (mensagem.contains("não autenticado")) {
                tipo = "NAO_AUTENTICADO";
                mensagem = "Você precisa estar autenticado para acessar este recurso.";
                status = HttpStatus.UNAUTHORIZED;
            }
        } else {
            mensagem = "Ocorreu um erro ao processar sua solicitação.";
        }
        
        response.put("erro", mensagem);
        response.put("tipo", tipo);
        response.put("status", status.value());
        
        return ResponseEntity.status(status).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("erro", "Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.");
        response.put("tipo", "ERRO_INTERNO");
        response.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        
        // Log do erro para debug
        System.err.println("Erro não tratado: " + ex.getClass().getName());
        System.err.println("Mensagem: " + ex.getMessage());
        ex.printStackTrace();
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
} 