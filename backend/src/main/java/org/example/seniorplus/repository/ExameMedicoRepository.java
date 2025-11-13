package org.example.seniorplus.repository;

import org.example.seniorplus.domain.ExameMedico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ExameMedicoRepository extends JpaRepository<ExameMedico, Long> {
	Optional<ExameMedico> findByCpf(String cpf);
	void deleteByCpf(String cpf);
}
