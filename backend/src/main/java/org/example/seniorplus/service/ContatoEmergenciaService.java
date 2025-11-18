package org.example.seniorplus.service;

import java.util.List;
import java.util.Objects;

import org.example.seniorplus.domain.ContatoEmergencia;
import org.example.seniorplus.repository.ContatoEmergenciaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContatoEmergenciaService {

    @Autowired
    private ContatoEmergenciaRepository repository;

    public List<ContatoEmergencia> listarPorCpf(String cpf) {
        return repository.findByIdosoCpfOrderByNomeAsc(normalizarCpf(cpf));
    }

    @Transactional
    public ContatoEmergencia salvar(String cpf, ContatoEmergencia contato) {
        contato.setId(null);
        contato.setIdosoCpf(normalizarCpf(cpf));
        return repository.save(contato);
    }

    @Transactional
    public ContatoEmergencia atualizar(String cpf, Long id, ContatoEmergencia contato) {
        ContatoEmergencia existente = repository.findById(id)
            .filter(c -> normalizarCpf(c.getIdosoCpf()).equals(normalizarCpf(cpf)))
            .orElseThrow(() -> new IllegalArgumentException("Contato não encontrado"));

        existente.setNome(contato.getNome());
        existente.setTelefone(contato.getTelefone());
        existente.setRelacao(contato.getRelacao());
        existente.setObservacoes(contato.getObservacoes());
        return repository.save(existente);
    }

    @Transactional
    public void remover(String cpf, Long id) {
        repository.deleteByIdAndIdosoCpf(id, normalizarCpf(cpf));
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
