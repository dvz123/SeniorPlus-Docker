package org.example.seniorplus.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.example.seniorplus.domain.Role;
import org.example.seniorplus.domain.Usuario;
import org.example.seniorplus.dto.AuthenticationResponse;
import org.example.seniorplus.dto.LoginRequest;
import org.example.seniorplus.dto.RegisterRequest;
import org.example.seniorplus.repository.UsuarioRepository;
import org.example.seniorplus.security.JwtService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Operation(summary = "Registrar usuário")
    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegisterRequest request,
                                                           Principal principal) {

        try {
            System.out.println("=== REGISTRO - DADOS RECEBIDOS ===");
            System.out.println("Nome: " + request.getNome());
            System.out.println("CPF: " + request.getCpf());
            System.out.println("Email: " + request.getEmail());
            System.out.println("Senha: " + (request.getSenha() != null ? "***" : "null"));
            System.out.println("TipoUsuario: " + request.getTipoUsuario());
            System.out.println("==================================");

            if (request.getNome() == null || request.getNome().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O nome é obrigatório.");
            }

            if (request.getEmail() == null || request.getEmail().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O e-mail é obrigatório.");
            }

            if (request.getSenha() == null || request.getSenha().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe uma senha válida.");
            }

            if (request.getTipoUsuario() == null || request.getTipoUsuario().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione o tipo de usuário (Cuidador ou Idoso).");
            }

            String cpfNormalizado = null;
            if (request.getCpf() != null && !request.getCpf().isBlank()) {
                cpfNormalizado = request.getCpf().replaceAll("\\D", "");
                if (cpfNormalizado.length() != 11) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O CPF deve conter 11 dígitos.");
                }
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O CPF é obrigatório.");
            }

            // Verificar se o email já existe
            if (usuarioRepository.existsByEmail(request.getEmail())) {
                System.out.println("ERRO: Email já cadastrado - " + request.getEmail());
                throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado.");
            }

            if (usuarioRepository.existsByCpf(cpfNormalizado)) {
                System.out.println("ERRO: CPF já cadastrado - " + cpfNormalizado);
                throw new ResponseStatusException(HttpStatus.CONFLICT, "CPF já cadastrado.");
            }

            Usuario usuario = new Usuario();
            usuario.setNome(request.getNome());
            usuario.setCpf(cpfNormalizado);
            usuario.setEmail(request.getEmail());
            usuario.setSenha(passwordEncoder.encode(request.getSenha()));

        // Mapear tipoUsuario para Role
        if (request.getTipoUsuario() != null) {
            switch (request.getTipoUsuario().toLowerCase()) {
                case "cuidador":
                    usuario.setRole(Role.ROLE_CUIDADOR);
                    break;
                case "idoso":
                    usuario.setRole(Role.ROLE_IDOSO);
                    break;
                default:
                    usuario.setRole(Role.ROLE_USER);
            }
        } else if (request.getRole() == Role.ROLE_ADMIN) {
            // Lógica para criar ADMIN (apenas ADMIN pode criar outro ADMIN)
            if (principal == null) {
                usuario.setRole(Role.ROLE_USER);
            } else {
                Usuario usuarioLogado = usuarioRepository.findByEmail(principal.getName())
                        .orElseThrow(() -> new RuntimeException("Usuário logado não encontrado"));

                if (usuarioLogado.getRole() == Role.ROLE_ADMIN) {
                    usuario.setRole(Role.ROLE_ADMIN);
                } else {
                    usuario.setRole(Role.ROLE_USER);
                }
            }
        } else {
            usuario.setRole(Role.ROLE_USER);
        }

        usuarioRepository.save(usuario);

        AuthenticationResponse token = jwtService.generateToken(usuario);

        System.out.println("SUCESSO: Usuário registrado - " + usuario.getEmail());
        return ResponseEntity.ok(token);
        
        } catch (Exception e) {
            System.out.println("ERRO NO REGISTRO: " + e.getClass().getName());
            System.out.println("MENSAGEM: " + e.getMessage());
            e.printStackTrace();
            if (e instanceof ResponseStatusException responseStatusException) {
                throw responseStatusException;
            }

            if (e instanceof DataIntegrityViolationException) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Não foi possível concluir o cadastro. Verifique se CPF ou e-mail já estão em uso.");
            }

            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao registrar usuário. Tente novamente.", e);
        }
    }

    @Operation(summary = "Autenticar usuário e obter token JWT", security = @SecurityRequirement(name = "BearerAuth"))
    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> authenticate(@RequestBody LoginRequest request) {
        System.out.println("=== LOGIN - TENTATIVA ===");
        System.out.println("Email: " + request.getEmail());
        try {
            Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário ou senha inválidos"));

            if (!passwordEncoder.matches(request.getSenha(), usuario.getSenha())) {
                System.out.println("Falha de login: senha incorreta para " + request.getEmail());
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário ou senha inválidos");
            }

            AuthenticationResponse token = jwtService.generateToken(usuario);
            System.out.println("SUCESSO LOGIN: " + usuario.getEmail());
            return ResponseEntity.ok(token);
        } catch (ResponseStatusException e) {
            System.out.println("ERRO LOGIN STATUS: " + e.getStatusCode() + " - " + e.getReason());
            throw e;
        } catch (Exception e) {
            System.out.println("ERRO LOGIN INESPERADO: " + e.getClass().getName() + " - " + e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao autenticar. Tente novamente.");
        }
    }

    @Operation(summary = "Obter dados do usuário autenticado", security = @SecurityRequirement(name = "BearerAuth"))
    @GetMapping("/conta")
    public ResponseEntity<Usuario> getConta(Principal principal) {
        if (principal == null) {
            throw new RuntimeException("Usuário não autenticado");
        }
        
        Usuario usuario = usuarioRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        return ResponseEntity.ok(usuario);
    }
}
