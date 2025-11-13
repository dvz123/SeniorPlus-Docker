package org.example.seniorplus.service;

import org.example.seniorplus.domain.Dieta;
import org.example.seniorplus.repository.DietaRepository;
import org.example.seniorplus.service.exception.ObjectNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
// import org.springframework.stereotype.Service; // disabled

import java.util.List;
import java.util.Optional;

// Dieta service disabled (feature not used by front-end). To re-enable, add @Service back.
public class DietaService {

    @Autowired
    private DietaRepository dietaRepository;

    public List<Dieta> buscarTodas() {
        try {
            return dietaRepository.findAll();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao buscar lista de dietas: " + e.getMessage());
        }
    }

    public Dieta buscarPorId(String id) {
        try {
            Optional<Dieta> obj = dietaRepository.findById(id);
            return obj.orElseThrow(() -> new ObjectNotFoundException("Dieta não encontrada com CPF: " + id));
        } catch (Exception e) {
            throw new RuntimeException("Erro ao buscar dieta com CPF: " + id + " - " + e.getMessage());
        }
    }

    public Dieta criar(Dieta obj) {
        try {
            return dietaRepository.save(obj);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Erro de integridade ao salvar a dieta: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("Erro ao salvar a dieta: " + e.getMessage());
        }
    }

    public Dieta atualizar(String id, Dieta novaDieta) {
        try {
            Dieta existente = buscarPorId(id);

            existente.setNome(novaDieta.getNome());
            existente.setDescricao(novaDieta.getDescricao());
            existente.setDataInicio(novaDieta.getDataInicio());
            existente.setDataFim(novaDieta.getDataFim());
            existente.setRestricoesAlimentares(novaDieta.getRestricoesAlimentares());
            existente.setRecomendacoes(novaDieta.getRecomendacoes());
            existente.setQuantidadeRefeicoes(novaDieta.getQuantidadeRefeicoes());
            existente.setIntervaloEntreRefeicoes(novaDieta.getIntervaloEntreRefeicoes());
            existente.setRefeicao1(novaDieta.getRefeicao1());
            existente.setRefeicao2(novaDieta.getRefeicao2());
            existente.setRefeicao3(novaDieta.getRefeicao3());
            existente.setRefeicao4(novaDieta.getRefeicao4());
            existente.setRefeicao5(novaDieta.getRefeicao5());
            existente.setRefeicao6(novaDieta.getRefeicao6());

            return dietaRepository.save(existente);
        } catch (ObjectNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Erro ao atualizar dieta com CPF: " + id + " - " + e.getMessage());
        }
    }

    public void deletar(String id) {
        try {
            buscarPorId(id); // Garante que existe
            dietaRepository.deleteById(id);
        } catch (ObjectNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Erro ao deletar dieta com CPF: " + id + " - " + e.getMessage());
        }
    }
}
