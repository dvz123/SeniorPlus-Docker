package org.example.seniorplus.repository;

import org.example.seniorplus.domain.Medicamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicamentoRepository extends JpaRepository<Medicamento, Long> {
	List<Medicamento> findByCpfOrderByNomeMedicamentoAsc(String cpf);
}
