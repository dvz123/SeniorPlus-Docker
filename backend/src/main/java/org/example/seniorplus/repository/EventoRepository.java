package org.example.seniorplus.repository;

import org.example.seniorplus.domain.Evento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface EventoRepository extends JpaRepository<Evento, Long> {

    @Query("SELECT e FROM Evento e WHERE e.idoso.cpf = :cpf ORDER BY e.data, e.horaInicio")
    List<Evento> findAllByIdosoCpf(@Param("cpf") String cpf);

    @Query("SELECT e FROM Evento e WHERE e.idoso.cpf = :cpf AND (e.data = CURRENT_DATE OR (e.data IS NULL AND e.dataHora >= CURRENT_DATE)) ORDER BY COALESCE(e.horaInicio, FUNCTION('TIME', e.dataHora))")
    List<Evento> findTodayEventsByIdosoCpf(@Param("cpf") String cpf);
}