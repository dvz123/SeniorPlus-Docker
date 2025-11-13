package org.example.seniorplus.repository;

import org.example.seniorplus.domain.Exercicio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ExercicioRepository extends JpaRepository<Exercicio, Long> {
	Optional<Exercicio> findByCpf(String cpf);
	void deleteByCpf(String cpf);
}
