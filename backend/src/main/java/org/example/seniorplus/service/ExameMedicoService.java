package org.example.seniorplus.service;

import org.example.seniorplus.domain.ExameMedico;
// no-op imports
import org.example.seniorplus.repository.ExameMedicoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExameMedicoService {

    @Autowired
    private ExameMedicoRepository exameMedicoRepository;

    // Método para listar todos os medicamentos
    public List<ExameMedico> listarTodos() {
        return exameMedicoRepository.findAll();
    }

    // Método para buscar um medicamento por CPF
    public ExameMedico buscarPorCpf(String cpf) {
    return exameMedicoRepository.findByCpf(cpf)
        .orElseThrow(() -> new RuntimeException("Exame não encontrado com o CPF: " + cpf));
    }

    // Método para salvar um novo medicamento
    public ExameMedico salvar(ExameMedico exameMedico) {
        try {
            return exameMedicoRepository.save(exameMedico);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao salvar o medicamento: " + e.getMessage());
        }
    }

    // Método para atualizar um exame existente
    public ExameMedico atualizar(String cpf, ExameMedico exameAtualizado) {
        ExameMedico existente = buscarPorCpf(cpf); // garante que existe
        try {
            // Propaga apenas campos mutáveis (mantém CPF como chave de busca nesta API)
            existente.setTipoExame(exameAtualizado.getTipoExame());
            existente.setResultado(exameAtualizado.getResultado());
            existente.setDataExame(exameAtualizado.getDataExame());
            existente.setLaboratorio(exameAtualizado.getLaboratorio());
            existente.setObservacoes(exameAtualizado.getObservacoes());

            return exameMedicoRepository.save(existente);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao atualizar o exame com CPF: " + cpf + ". " + e.getMessage());
        }
    }

    public void deletar(String cpf) {
        // garante que existe
        buscarPorCpf(cpf);
        try {
            exameMedicoRepository.deleteByCpf(cpf);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao deletar o exame com CPF: " + cpf + ". " + e.getMessage());
        }
    }

}
