package org.example.seniorplus.controller;

import org.example.seniorplus.domain.Consulta;
import org.example.seniorplus.service.ConsultaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping(value = "/api/v1/consulta")
public class ConsultaController {

    @Autowired
    private ConsultaService service;

    @RequestMapping(method = RequestMethod.GET)
    public ResponseEntity<List<Consulta>> buscarTodas() {
        List<Consulta> list = service.buscarTodos();
        return ResponseEntity.ok().body(list);
    }

    @RequestMapping(value = "/{id}", method = RequestMethod.GET)
    public ResponseEntity<Consulta> buscarPorId(@PathVariable String cpf) {
        Consulta obj = service.buscarPorCpf(cpf);
        return ResponseEntity.ok().body(obj);
    }

    @RequestMapping(method = RequestMethod.POST)
    public ResponseEntity<Void> criar(@RequestBody Consulta consulta) {
        Consulta obj = service.criar(consulta);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(obj.getId()).toUri();
        return ResponseEntity.created(uri).build();
    }

    @RequestMapping(value = "/{id}", method = RequestMethod.PUT)
    public ResponseEntity<Consulta> atualizar(@PathVariable String id, @RequestBody Consulta consulta) {
        Consulta objAtualizado = service.atualizar(id, consulta);
        return ResponseEntity.ok().body(objAtualizado);
    }

    @RequestMapping(value = "/{id}", method = RequestMethod.DELETE)
    public ResponseEntity<Void> deletar(@PathVariable String id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
