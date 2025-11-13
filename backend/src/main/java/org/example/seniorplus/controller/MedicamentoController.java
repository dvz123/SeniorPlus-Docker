package org.example.seniorplus.controller;

import org.example.seniorplus.domain.Medicamento;
import org.example.seniorplus.service.MedicamentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping(value = "/api/v1/medicamentos")
public class MedicamentoController {

    @Autowired
    private MedicamentoService service;

    // GET /api/v1/medicamentos
    @RequestMapping(method = RequestMethod.GET)
    public ResponseEntity<List<Medicamento>> listarTodos() {
        List<Medicamento> list = service.listarTodos();
        return ResponseEntity.ok().body(list);
    }

    // GET /api/v1/medicamentos/{cpf}
    @RequestMapping(value = "/{cpf}", method = RequestMethod.GET)
    public ResponseEntity<Medicamento> buscarPorCpf(@PathVariable String cpf) {
        Medicamento obj = service.buscarPorCpf(cpf);
        return ResponseEntity.ok().body(obj);
    }

    // POST /api/v1/medicamentos
    @RequestMapping(method = RequestMethod.POST)
    public ResponseEntity<Void> criar(@RequestBody Medicamento medicamento) {
        Medicamento obj = service.salvar(medicamento);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{cpf}").buildAndExpand(obj.getCpf()).toUri();
        return ResponseEntity.created(uri).build();
    }

    // PUT /api/v1/medicamentos/{cpf}
    @RequestMapping(value = "/{cpf}", method = RequestMethod.PUT)
    public ResponseEntity<Medicamento> atualizar(@PathVariable String cpf, @RequestBody Medicamento medicamento) {
        Medicamento objAtualizado = service.atualizar(cpf, medicamento);
        return ResponseEntity.ok().body(objAtualizado);
    }

    // DELETE /api/v1/medicamentos/{cpf}
    @RequestMapping(value = "/{cpf}", method = RequestMethod.DELETE)
    public ResponseEntity<Void> deletar(@PathVariable String cpf) {
        service.deletar(cpf);
        return ResponseEntity.noContent().build();
    }
}
