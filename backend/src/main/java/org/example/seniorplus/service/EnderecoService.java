package org.example.seniorplus.service;

import org.example.seniorplus.domain.Endereco;
import org.example.seniorplus.repository.EnderecoRepository;
import org.example.seniorplus.service.exception.ObjectNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EnderecoService {

    @Autowired
    private EnderecoRepository enderecoRepository;

    public List<Endereco> getAllEndereco() {
        return enderecoRepository.findAll();
    }
    public Endereco getEnderecoById(Long id) {
        return enderecoRepository.findById(id)
                .orElseThrow(() -> new ObjectNotFoundException("Endereço não encontrado com ID: " + id));
    }

    public Endereco saveEndereco(Endereco obj) {
        return enderecoRepository.save(obj);
    }

    public void deleteEndereco(Long id) {
        enderecoRepository.deleteById(id);
    }
}
