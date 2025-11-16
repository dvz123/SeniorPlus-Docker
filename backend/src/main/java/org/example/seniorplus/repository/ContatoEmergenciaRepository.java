package org.example.seniorplus.repository;

import java.util.List;

import org.example.seniorplus.domain.ContatoEmergencia;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContatoEmergenciaRepository extends JpaRepository<ContatoEmergencia, Long> {
    List<ContatoEmergencia> findByIdosoCpfOrderByNomeAsc(String idosoCpf);
    void deleteByIdAndIdosoCpf(Long id, String idosoCpf);
}
