package org.example.seniorplus.service;

import java.time.LocalTime;
import java.util.List;
import java.util.Objects;

import org.example.seniorplus.domain.Medicamento;
import org.example.seniorplus.repository.MedicamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MedicamentoService {

    @Autowired
    private MedicamentoRepository medicamentoRepository;

    public List<Medicamento> listarPorCpf(String cpf) {
        return medicamentoRepository.findByCpfOrderByNomeMedicamentoAsc(normalizarCpf(cpf));
    }

    public Medicamento salvar(String cpf, Medicamento medicamento) {
        medicamento.setCpf(normalizarCpf(cpf));
        prepararHorarios(medicamento);
        return medicamentoRepository.save(medicamento);
    }

    public Medicamento atualizar(Long id, Medicamento atualizado) {
        Objects.requireNonNull(id, "Id do medicamento não pode ser nulo");
        Medicamento existente = medicamentoRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Medicamento não encontrado: " + id));

        existente.setNomeMedicamento(atualizado.getNomeMedicamento());
        existente.setDosagem(atualizado.getDosagem());
        existente.setFormaAdministracao(atualizado.getFormaAdministracao());
        existente.setInstrucoes(atualizado.getInstrucoes());
        existente.setDataInicio(atualizado.getDataInicio());
        existente.setDataFim(atualizado.getDataFim());
        existente.setRepetirDiariamente(atualizado.isRepetirDiariamente());
        existente.setIntervaloHoras(atualizado.getIntervaloHoras());
        existente.setNomeUsuario(atualizado.getNomeUsuario());
        existente.setContatoEmergencia(atualizado.getContatoEmergencia());
        existente.setNotificarPorEmail(atualizado.isNotificarPorEmail());
        existente.setNotificarPorApp(atualizado.isNotificarPorApp());
        existente.setNotificarPorSms(atualizado.isNotificarPorSms());
        existente.setIntervaloMinutos(atualizado.getIntervaloMinutos());
        existente.setHorarios(atualizado.getHorarios());

        prepararHorarios(existente);
        return medicamentoRepository.save(existente);
    }

    public void deletar(Long id) {
        Objects.requireNonNull(id, "Id do medicamento não pode ser nulo");
        medicamentoRepository.deleteById(id);
    }

    private void prepararHorarios(Medicamento medicamento) {
        if (medicamento.getHorarios() == null || medicamento.getHorarios().isEmpty()) {
            return;
        }
        // Normaliza horários removendo segundos e nanos
        List<LocalTime> normalizados = medicamento.getHorarios().stream()
            .filter(Objects::nonNull)
            .map(time -> time.withSecond(0).withNano(0))
            .toList();
        medicamento.setHorarios(normalizados);
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
