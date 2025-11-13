package org.example.seniorplus.controller;

import org.example.seniorplus.domain.Exercicio;
import org.example.seniorplus.service.ExercicioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping(value = "/api/v1/exercicio")
public class ExercicioController {

    @Autowired
    private ExercicioService service;

    @RequestMapping(method = RequestMethod.GET)
    public ResponseEntity<List<Exercicio>> buscarTodas() {
        List<Exercicio> list = service.listarTodos();
        return ResponseEntity.ok().body(list);
    }

    @RequestMapping(value = "/{id}", method = RequestMethod.GET)
    public ResponseEntity<Exercicio> buscarPorId(@PathVariable String cpf) {
        Exercicio obj = service.buscarPorCpf(cpf);
        return ResponseEntity.ok().body(obj);
    }

    @RequestMapping(method = RequestMethod.POST)
    public ResponseEntity<Void> criar(@RequestBody Exercicio exercicio) {
        Exercicio obj = service.salvar(exercicio);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{cpf}").buildAndExpand(obj.getCpf()).toUri();
        return ResponseEntity.created(uri).build();
    }

    @RequestMapping(value = "/{cpf}", method = RequestMethod.PUT)
    public ResponseEntity<Exercicio> atualizar(@PathVariable String cpf, @RequestBody Exercicio exercicio) {
        Exercicio objAtualizado = service.atualizar(cpf, exercicio);
        return ResponseEntity.ok().body(objAtualizado);
    }

    @RequestMapping(value = "/{cpf}", method = RequestMethod.DELETE)
    public ResponseEntity<Void> deletar(@PathVariable String cpf) {
        service.deletar(cpf);
        return ResponseEntity.noContent().build();
    }
}
