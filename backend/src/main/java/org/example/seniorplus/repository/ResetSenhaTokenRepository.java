package org.example.seniorplus.repository;


import org.example.seniorplus.domain.ResetSenhaToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResetSenhaTokenRepository extends JpaRepository<ResetSenhaToken, Long> {
    Optional<ResetSenhaToken> findByToken(String token);
    void deleteByUsuarioId(Long usuarioId);
} 