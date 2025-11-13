package org.example.seniorplus.controller;

import org.example.seniorplus.domain.Dieta;
import org.example.seniorplus.service.DietaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import java.net.URI;
import java.util.List;

// Dieta endpoints are currently disabled because the front-end does not use them yet.
// To enable, restore the annotations below and provide the Dieta service.
// @RestController
// @RequestMapping(value = "/api/v1/dieta")
public class DietaController {

    @Autowired
    private DietaService service;

    @RequestMapping(method = RequestMethod.GET)
    public ResponseEntity<List<Dieta>> buscarTodas() {
        List<Dieta> list = service.buscarTodas();
        return ResponseEntity.ok().body(list);
    }

    @RequestMapping(value = "/{id}", method = RequestMethod.GET)
    public ResponseEntity<Dieta> buscarPorId(@PathVariable String id) {
        Dieta obj = service.buscarPorId(id);
        return ResponseEntity.ok().body(obj);
    }

    @RequestMapping(method = RequestMethod.POST)
    public ResponseEntity<Void> criar(@RequestBody Dieta dieta) {
        Dieta obj = service.criar(dieta);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(obj.getId()).toUri();
        return ResponseEntity.created(uri).build();
    }

    @RequestMapping(value = "/{id}", method = RequestMethod.PUT)
    public ResponseEntity<Dieta> atualizar(@PathVariable String id, @RequestBody Dieta dieta) {
        Dieta objAtualizado = service.atualizar(id, dieta);
        return ResponseEntity.ok().body(objAtualizado);
    }

    @RequestMapping(value = "/{id}", method = RequestMethod.DELETE)
    public ResponseEntity<Void> deletar(@PathVariable String id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
