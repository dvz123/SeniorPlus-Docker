package org.example.seniorplus.repository;

import org.example.seniorplus.domain.Evento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface EventoRepository extends JpaRepository<Evento, Long> {
    @Query("SELECT e FROM Evento e WHERE e.idoso.id = :idosoId AND DATE(e.dataHora) = CURRENT_DATE ORDER BY e.dataHora")
    List<Evento> findTodayEventsByIdosoId(@Param("idosoId") Long idosoId);
}