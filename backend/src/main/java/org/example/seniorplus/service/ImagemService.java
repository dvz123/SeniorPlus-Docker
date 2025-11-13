package org.example.seniorplus.service;

import org.example.seniorplus.domain.Imagem;
import org.example.seniorplus.repository.ImagemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ImagemService {

    @Autowired
    private ImagemRepository imagemRepository;

    // Listar todas as imagens
    public List<Imagem> listarTodas() {
        return imagemRepository.findAll();
    }

    // Buscar todas as imagens por CPF
    public List<Imagem> listarPorCpf(String cpf) {
        return imagemRepository.findAllByCpf(cpf);
    }

    // Buscar imagem por ID
    public Imagem buscarPorId(Long id) {
        return imagemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Imagem não encontrada com ID: " + id));
    }

    // Salvar nova imagem
    public Imagem salvar(Imagem imagem) {
        return imagemRepository.save(imagem);
    }

    // Atualizar imagem por ID
    public Imagem atualizar(Long id, Imagem novaImagem) {
        Imagem existente = buscarPorId(id);

        existente.setNomeArquivo(novaImagem.getNomeArquivo());
        existente.setUrl(novaImagem.getUrl());
        existente.setTipo(novaImagem.getTipo());
        existente.setDataUpload(novaImagem.getDataUpload());

        return imagemRepository.save(existente);
    }

    // Deletar imagem por ID
    public void deletar(Long id) {
        Imagem imagem = buscarPorId(id);
        imagemRepository.delete(imagem);
    }
}
