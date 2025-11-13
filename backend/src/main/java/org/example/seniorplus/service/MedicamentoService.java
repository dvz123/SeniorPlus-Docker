package org.example.seniorplus.service;

import org.example.seniorplus.domain.Medicamento;
import org.example.seniorplus.repository.MedicamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MedicamentoService {

    @Autowired
    private MedicamentoRepository medicamentoRepository;

    // Método para listar todos os medicamentos
    public List<Medicamento> listarTodos() {
        return medicamentoRepository.findAll();
    }

    // Método para buscar um medicamento por CPF
    public Medicamento buscarPorCpf(String cpf) {
    return medicamentoRepository.findByCpf(cpf)
        .orElseThrow(() -> new RuntimeException("Medicamento não encontrado com o CPF: " + cpf));
    }

    // Método para salvar um novo medicamento
    public Medicamento salvar(Medicamento medicamento) {
        try {
            return medicamentoRepository.save(medicamento);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao salvar o medicamento: " + e.getMessage());
        }
    }

    // Método para atualizar um medicamento existente
    public Medicamento atualizar(String cpf, Medicamento medicamentoAtualizado) {
        Medicamento medicamento = buscarPorCpf(cpf); // Reutiliza o método buscarPorCpf para verificar se existe
        try {
            // Atualiza os atributos do medicamento com base nos valores do objeto recebido
            medicamento.setNomeMedicamento(medicamentoAtualizado.getNomeMedicamento());
            medicamento.setDosagem(medicamentoAtualizado.getDosagem());
            medicamento.setFormaAdministracao(medicamentoAtualizado.getFormaAdministracao());
            medicamento.setInstrucoes(medicamentoAtualizado.getInstrucoes());
            medicamento.setDataInicio(medicamentoAtualizado.getDataInicio());
            medicamento.setDataFim(medicamentoAtualizado.getDataFim());
            medicamento.setRepetirDiariamente(medicamentoAtualizado.isRepetirDiariamente());
            medicamento.setIntervaloHoras(medicamentoAtualizado.getIntervaloHoras());
            medicamento.setNomeUsuario(medicamentoAtualizado.getNomeUsuario());
            medicamento.setContatoEmergencia(medicamentoAtualizado.getContatoEmergencia());
            medicamento.setNotificarPorEmail(medicamentoAtualizado.isNotificarPorEmail());
            medicamento.setNotificarPorApp(medicamentoAtualizado.isNotificarPorApp());
            medicamento.setNotificarPorSms(medicamentoAtualizado.isNotificarPorSms());

            // Salva as alterações no repositório
            return medicamentoRepository.save(medicamento);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao atualizar o medicamento com CPF: " + cpf + ". " + e.getMessage());
        }
    }

    // Método para deletar um medicamento por CPF
    public void deletar(String cpf) {
        // garante que existe
        buscarPorCpf(cpf);
        try {
            medicamentoRepository.deleteByCpf(cpf);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao deletar o medicamento com CPF: " + cpf + ". " + e.getMessage());
        }
    }
}
