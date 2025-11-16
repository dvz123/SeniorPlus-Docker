package org.example.seniorplus.repository;

import org.example.seniorplus.domain.Mensagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MensagemRepository extends JpaRepository<Mensagem, Long> {
    @Query("SELECT m FROM Mensagem m WHERE m.idoso.cpf = :cpf ORDER BY m.dataHora ASC")
    List<Mensagem> findByIdosoCpfOrderByDataHoraAsc(@Param("cpf") String cpf);
}