package org.example.seniorplus.service;

import org.example.seniorplus.domain.Consulta;
import org.example.seniorplus.repository.ConsultaRepository;
import org.example.seniorplus.service.exception.ObjectNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;


import java.util.List;
import java.util.Optional;

@Service
public class ConsultaService {

    @Autowired
    private ConsultaRepository repository;

    public List<Consulta> buscarTodos() {
        try {
            return repository.findAll();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao buscar lista de consultas: " + e.getMessage());
        }
    }

    public Consulta buscarPorCpf(String cpf) {
        try {
            Optional<Consulta> obj = repository.findByCpf(cpf);
            return obj.orElseThrow(() -> new ObjectNotFoundException("Consulta não encontrada com CPF: " + cpf));
        } catch (Exception e) {
            throw new RuntimeException("Erro ao buscar consulta com CPF: " + cpf + " - " + e.getMessage());
        }
    }

    public Consulta criar(Consulta obj) {
        try {
            return repository.save(obj);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Erro de integridade ao salvar a consulta: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("Erro ao salvar a consulta: " + e.getMessage());
        }
    }

    public void deletar(String cpf) {
        try {
            buscarPorCpf(cpf); // garante que existe
            repository.deleteByCpf(cpf);
        } catch (ObjectNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Erro ao deletar consulta com CPF: " + cpf + " - " + e.getMessage());
        }
    }

    public Consulta atualizar(String cpf, Consulta novaConsulta) {
        try {
            // Buscar o objeto existente no banco de
            Consulta existente = buscarPorCpf(cpf);

            // Atualizar os campos do objeto existente com os dados novos
            existente.setNomeMedico(novaConsulta.getNomeMedico());
            existente.setEspecialidade(novaConsulta.getEspecialidade());
            existente.setData(novaConsulta.getData());
            existente.setHora(novaConsulta.getHora());
            existente.setLocal(novaConsulta.getLocal());
            existente.setObservacoes(novaConsulta.getObservacoes());
            existente.setImgReceita(novaConsulta.getImgReceita());

            // Salvar a consulta atualizada no banco de dados
            return repository.save(existente);
        } catch (ObjectNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Erro ao atualizar consulta com CPF: " + cpf + " - " + e.getMessage());
        }
    }
}
