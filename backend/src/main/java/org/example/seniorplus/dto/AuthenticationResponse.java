package org.example.seniorplus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationResponse {
    private String token;
    private LocalDateTime expiresAt;

    public static AuthenticationResponse of(String token, LocalDateTime expiresAt) {
        return AuthenticationResponse.builder()
                .token(token)
                .expiresAt(expiresAt.atZone(ZoneId.of("America/Sao_Paulo")).toLocalDateTime())
                .build();
    }
} 