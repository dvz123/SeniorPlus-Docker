package org.example.seniorplus.controller;

import java.util.List;

import org.example.seniorplus.domain.Medicamento;
import org.example.seniorplus.dto.MedicamentoRequest;
import org.example.seniorplus.service.MedicamentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class MedicamentoController {

    @Autowired
    private MedicamentoService service;

    @GetMapping("/idosos/{cpf}/medicamentos")
    public ResponseEntity<List<Medicamento>> listar(@PathVariable String cpf) {
        return ResponseEntity.ok(service.listarPorCpf(cpf));
    }

    @PostMapping("/idosos/{cpf}/medicamentos")
    public ResponseEntity<Medicamento> criar(@PathVariable String cpf, @RequestBody MedicamentoRequest request) {
        Medicamento salvo = service.salvar(cpf, toMedicamento(request));
        return ResponseEntity.status(201).body(salvo);
    }

    @PutMapping("/medicamentos/{id}")
    public ResponseEntity<Medicamento> atualizar(@PathVariable Long id, @RequestBody MedicamentoRequest request) {
        Medicamento atualizado = service.atualizar(id, toMedicamento(request));
        return ResponseEntity.ok(atualizado);
    }

    @DeleteMapping("/medicamentos/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }

    private Medicamento toMedicamento(MedicamentoRequest request) {
        Medicamento medicamento = new Medicamento();
        medicamento.setNomeMedicamento(request.getNomeMedicamento());
        medicamento.setDosagem(request.getDosagem());
        medicamento.setFormaAdministracao(request.getFormaAdministracao());
        medicamento.setInstrucoes(request.getInstrucoes());
        medicamento.setDataInicio(request.getDataInicio());
        medicamento.setDataFim(request.getDataFim());
        medicamento.setHorarios(request.getHorarios());
        medicamento.setRepetirDiariamente(request.isRepetirDiariamente());
        medicamento.setIntervaloHoras(request.getIntervaloHoras());
        medicamento.setIntervaloMinutos(request.getIntervaloMinutos());
        medicamento.setNomeUsuario(request.getNomeUsuario());
        medicamento.setContatoEmergencia(request.getContatoEmergencia());
        medicamento.setNotificarPorEmail(request.isNotificarPorEmail());
        medicamento.setNotificarPorApp(request.isNotificarPorApp());
        medicamento.setNotificarPorSms(request.isNotificarPorSms());
        return medicamento;
    }
}
