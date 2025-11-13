package org.example.seniorplus.repository;

import org.example.seniorplus.domain.Medicamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MedicamentoRepository extends JpaRepository<Medicamento, Long> {
	Optional<Medicamento> findByCpf(String cpf);
	void deleteByCpf(String cpf);
}
