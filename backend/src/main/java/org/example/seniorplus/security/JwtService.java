package org.example.seniorplus.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.example.seniorplus.domain.Usuario;
import org.example.seniorplus.dto.AuthenticationResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
@Slf4j
public class JwtService {

    @Value("${jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String secretKey;

    @Value("${jwt.expiration-minutes:1440}")
    private long jwtExpirationMinutes;

    private Key signingKey;

    @PostConstruct
    public void init() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            signingKey = Keys.secretKeyFor(SignatureAlgorithm.HS256);
            log.warn("jwt.secret too short. Generated temporary key.");
        } else {
            signingKey = Keys.hmacShaKeyFor(keyBytes);
        }
    }

    public AuthenticationResponse generateToken(UserDetails userDetails) {
        Usuario usuario = (Usuario) userDetails;
        Map<String, Object> claims = new HashMap<>();
        claims.put("cpf", usuario.getCpf());
        claims.put("roles", List.of(usuario.getRole().name())); // adiciona roles no token
        return generateToken(claims, userDetails);
    }

    public AuthenticationResponse generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        LocalDateTime expirationDateTime = LocalDateTime.now().plusMinutes(jwtExpirationMinutes);
        Date expirationDate = Date.from(expirationDateTime.atZone(ZoneId.systemDefault()).toInstant());

        String token = Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(expirationDate)
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();

        return AuthenticationResponse.of(token, expirationDateTime);
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
