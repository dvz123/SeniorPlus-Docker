package org.example.seniorplus.controller;

import org.example.seniorplus.domain.ExameMedico;
import org.example.seniorplus.service.ExameMedicoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping(value = "/api/v1/exame")
public class ExameMedicoController {

    @Autowired
    private ExameMedicoService service;

    @RequestMapping(method = RequestMethod.GET)
    public ResponseEntity<List<ExameMedico>> listarTodos() {
        List<ExameMedico> list = service.listarTodos();
        return ResponseEntity.ok().body(list);
    }

    @RequestMapping(value = "/{cpf}", method = RequestMethod.GET)
    public ResponseEntity<ExameMedico> buscarPorCpf(@PathVariable String cpf) {
        ExameMedico obj = service.buscarPorCpf(cpf);
        return ResponseEntity.ok().body(obj);
    }

    @RequestMapping(method = RequestMethod.POST)
    public ResponseEntity<Void> salvar(@RequestBody ExameMedico exameMedico) {
        ExameMedico obj = service.salvar(exameMedico);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{cpf}").buildAndExpand(obj.getCpf()).toUri();
        return ResponseEntity.created(uri).build();
    }

    @RequestMapping(value = "/{cpf}", method = RequestMethod.DELETE)
    public ResponseEntity<Void> deletar(@PathVariable String cpf) {
        service.deletar(cpf);
        return ResponseEntity.noContent().build();
    }

    @RequestMapping(value = "/{cpf}", method = RequestMethod.PUT)
    public ResponseEntity<ExameMedico> atualizar(@PathVariable String cpf, @RequestBody ExameMedico exameMedico) {
        ExameMedico objAtualizado = service.salvar(exameMedico); // Ou crie método atualizar se quiser lógica separada
        return ResponseEntity.ok().body(objAtualizado);
    }
}
