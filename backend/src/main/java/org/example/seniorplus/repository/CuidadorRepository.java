package org.example.seniorplus.repository;

import org.example.seniorplus.domain.Cuidador;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CuidadorRepository extends JpaRepository<Cuidador, String> {
}
