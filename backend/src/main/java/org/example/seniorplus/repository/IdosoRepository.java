package org.example.seniorplus.repository;

import org.example.seniorplus.domain.Idoso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IdosoRepository extends JpaRepository<Idoso, String> {
	List<Idoso> findByCuidadorCpf(String cuidadorCpf);
}
