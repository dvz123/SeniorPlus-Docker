package org.example.seniorplus.controller;

import org.example.seniorplus.domain.Cuidador;
import org.example.seniorplus.service.CuidadorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping(value = "/api/v1/cuidador")
public class CuidadorController {

    @Autowired
    private CuidadorService service;

    @RequestMapping(method = RequestMethod.GET)
    public ResponseEntity<List<Cuidador>> buscarTodas() {
        List<Cuidador> list = service.buscarTodos();
        return ResponseEntity.ok().body(list);
    }

    @RequestMapping(value = "/{id}", method = RequestMethod.GET)
    public ResponseEntity<Cuidador> buscarPorId(@PathVariable String cpf) {
        Cuidador obj = service.buscarPorCpf(cpf);
        return ResponseEntity.ok().body(obj);
    }

    @RequestMapping(method = RequestMethod.POST)
    public ResponseEntity<Void> criar(@RequestBody Cuidador cuidador) {
        Cuidador obj = service.criar(cuidador);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{cpf}").buildAndExpand(obj.getCpf()).toUri();
        return ResponseEntity.created(uri).build();
    }

    @RequestMapping(value = "/{cpf}", method = RequestMethod.PUT)
    public ResponseEntity<Cuidador> atualizar(@PathVariable String cpf, @RequestBody Cuidador cuidador) {
        Cuidador objAtualizado = service.atualizar(cpf, cuidador);
        return ResponseEntity.ok().body(objAtualizado);
    }

    @RequestMapping(value = "/{cpf}", method = RequestMethod.DELETE)
    public ResponseEntity<Void> deletar(@PathVariable String id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
