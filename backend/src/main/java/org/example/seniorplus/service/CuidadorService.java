package org.example.seniorplus.service;

import org.example.seniorplus.domain.Cuidador;
import org.example.seniorplus.service.exception.ObjectNotFoundException;
import org.example.seniorplus.repository.CuidadorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CuidadorService {

    @Autowired
    private CuidadorRepository cuidadorRepository;

    // Buscar todos os cuidadores
    public List<Cuidador> buscarTodos() {
        try {
            return cuidadorRepository.findAll();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao buscar lista de cuidadores: " + e.getMessage());
        }
    }

    // Buscar cuidador por CPF
    public Cuidador buscarPorCpf(String cpf) {
        try {
            Optional<Cuidador> obj = cuidadorRepository.findById(cpf);
            return obj.orElseThrow(() -> new ObjectNotFoundException("Cuidador não encontrado com CPF: " + cpf));
        } catch (Exception e) {
            throw new RuntimeException("Erro ao buscar cuidador com CPF: " + cpf + " - " + e.getMessage());
        }
    }

    // Criar cuidador
    public Cuidador criar(Cuidador obj) {
        try {
            return cuidadorRepository.save(obj);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Erro de integridade ao salvar o cuidador: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("Erro ao salvar o cuidador: " + e.getMessage());
        }
    }

    // Deletar cuidador
    public void deletar(String cpf) {
        try {
            buscarPorCpf(cpf); // Garante que existe
            cuidadorRepository.deleteById(cpf);
        } catch (ObjectNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Erro ao deletar cuidador com CPF: " + cpf + " - " + e.getMessage());
        }
    }

    // Atualizar cuidador
    public Cuidador atualizar(String cpf, Cuidador novoCuidador) {
        try {
            Cuidador existente = buscarPorCpf(cpf);

            existente.setNome(novoCuidador.getNome());
            existente.setRg(novoCuidador.getRg());
            existente.setEmail(novoCuidador.getEmail());
            existente.setDataNascimento(novoCuidador.getDataNascimento());
            existente.setTelefone(novoCuidador.getTelefone());
            existente.getEnderecos().clear();
            existente.getEnderecos().addAll(novoCuidador.getEnderecos());

            return cuidadorRepository.save(existente);
        } catch (ObjectNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Erro ao atualizar cuidador com CPF: " + cpf + " - " + e.getMessage());
        }
    }
}
