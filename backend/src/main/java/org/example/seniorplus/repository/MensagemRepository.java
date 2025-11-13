package org.example.seniorplus.repository;

import org.example.seniorplus.domain.Mensagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MensagemRepository extends JpaRepository<Mensagem, Long> {
    @Query("SELECT m FROM Mensagem m WHERE m.idoso.id = :idosoId ORDER BY m.dataHora DESC")
    List<Mensagem> findByIdosoIdOrderByDataHoraDesc(@Param("idosoId") Long idosoId);
}