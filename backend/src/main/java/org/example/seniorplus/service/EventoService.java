package org.example.seniorplus.service;

import org.example.seniorplus.domain.Evento;
import org.example.seniorplus.domain.Idoso;
import org.example.seniorplus.repository.EventoRepository;
import org.example.seniorplus.repository.IdosoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Objects;

@Service
public class EventoService {
    
    @Autowired
    private EventoRepository eventoRepository;

    @Autowired
    private IdosoRepository idosoRepository;

    public List<Evento> listarEventos(String cpf) {
        String normalizado = normalizarCpf(cpf);
        return eventoRepository.findAllByIdosoCpf(normalizado);
    }

    public List<Evento> listarEventosDeHoje(String cpf) {
        String normalizado = normalizarCpf(cpf);
        return eventoRepository.findTodayEventsByIdosoCpf(normalizado);
    }

    public Evento salvarEvento(String cpf, Evento evento) {
        Idoso idoso = recuperarIdoso(cpf);
        evento.setId(null);
        evento.setIdoso(idoso);
        prepararEvento(evento);
        return eventoRepository.save(evento);
    }

    public Evento atualizarEvento(Long id, Evento atualizado) {
        Objects.requireNonNull(id, "Evento id não pode ser nulo");
        Evento existente = eventoRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Evento não encontrado: " + id));

        existente.setTitulo(atualizado.getTitulo());
        existente.setDescricao(atualizado.getDescricao());
        existente.setData(atualizado.getData());
        existente.setHoraInicio(atualizado.getHoraInicio());
        existente.setHoraFim(atualizado.getHoraFim());
        existente.setLocalEvento(atualizado.getLocalEvento());
        existente.setCategoria(atualizado.getCategoria());
        existente.setObservacoes(atualizado.getObservacoes());
        existente.setStatus(atualizado.getStatus());
        existente.setDataHora(atualizado.getDataHora());
        prepararEvento(existente);

        return eventoRepository.save(existente);
    }

    public void atualizarStatusEvento(Long eventoId, String novoStatus) {
        Objects.requireNonNull(eventoId, "Evento id não pode ser nulo");
        eventoRepository.findById(eventoId).ifPresent(evento -> {
            evento.setStatus(novoStatus);
            eventoRepository.save(evento);
        });
    }

    public void deletarEvento(Long id) {
        Objects.requireNonNull(id, "Evento id não pode ser nulo");
        eventoRepository.deleteById(id);
    }

    private void prepararEvento(Evento evento) {
        if (evento.getStatus() == null || evento.getStatus().isBlank()) {
            evento.setStatus("PENDENTE");
        }

        if (evento.getData() == null && evento.getDataHora() != null) {
            evento.setData(evento.getDataHora().toLocalDate());
        }

        if (evento.getHoraInicio() == null && evento.getDataHora() != null) {
            evento.setHoraInicio(evento.getDataHora().toLocalTime());
        }

        if (evento.getDataHora() == null && evento.getData() != null && evento.getHoraInicio() != null) {
            evento.setDataHora(java.time.LocalDateTime.of(evento.getData(), evento.getHoraInicio()));
        }
    }

    private Idoso recuperarIdoso(String cpf) {
        String normalizado = normalizarCpf(cpf);
        Objects.requireNonNull(normalizado, "CPF normalizado não pode ser nulo");
        return idosoRepository.findById(normalizado)
            .orElseThrow(() -> new IllegalArgumentException("Idoso não encontrado: " + cpf));
    }

    private String normalizarCpf(String cpf) {
        Objects.requireNonNull(cpf, "CPF não pode ser nulo");
        String apenasDigitos = cpf.replaceAll("\\D", "");
        if (apenasDigitos.length() == 11) {
            return apenasDigitos;
        }
        return cpf.trim();
    }
}