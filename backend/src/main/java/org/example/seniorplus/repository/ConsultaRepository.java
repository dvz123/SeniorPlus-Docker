package org.example.seniorplus.repository;

import org.example.seniorplus.domain.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConsultaRepository extends JpaRepository<Consulta, Long> {
	Optional<Consulta> findByCpf(String cpf);
	void deleteByCpf(String cpf);
}
