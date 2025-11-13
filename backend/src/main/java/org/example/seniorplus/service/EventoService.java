package org.example.seniorplus.service;

import org.example.seniorplus.domain.Evento;
import org.example.seniorplus.repository.EventoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class EventoService {
    
    @Autowired
    private EventoRepository eventoRepository;

    public List<Evento> getEventosDeHoje(Long idosoId) {
        return eventoRepository.findTodayEventsByIdosoId(idosoId);
    }

    public Evento salvarEvento(Evento evento) {
        return eventoRepository.save(evento);
    }

    public void atualizarStatusEvento(Long eventoId, String novoStatus) {
        eventoRepository.findById(eventoId).ifPresent(evento -> {
            evento.setStatus(novoStatus);
            eventoRepository.save(evento);
        });
    }
}