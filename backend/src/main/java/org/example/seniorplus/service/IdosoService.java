package org.example.seniorplus.service;

import org.example.seniorplus.domain.Cuidador;
import org.example.seniorplus.domain.Idoso;
import org.example.seniorplus.domain.Role;
import org.example.seniorplus.domain.Usuario;
import org.example.seniorplus.repository.IdosoRepository;
import org.example.seniorplus.repository.CuidadorRepository;
import org.example.seniorplus.repository.UsuarioRepository;
import org.example.seniorplus.service.exception.ObjectNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class IdosoService {

    @Autowired
    private IdosoRepository repository;

    @Autowired
    private CuidadorRepository cuidadorRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    public List<Idoso> buscarTodos() {
        try {
            return repository.findAll();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao buscar lista de idosos: " + e.getMessage());
        }
    }

    public List<Idoso> buscarPorCuidadorCpf(String cuidadorCpf) {
        try {
            return repository.findByCuidadorCpf(cuidadorCpf);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao buscar idosos vinculados ao cuidador: " + cuidadorCpf + " - " + e.getMessage());
        }
    }

    public Idoso buscarPorCpf(String cpf) {
        try {
            String cpfNormalizado = normalizarCpf(cpf);
            java.util.Objects.requireNonNull(cpfNormalizado, "CPF não pode ser nulo");
            Optional<Idoso> obj = repository.findById(cpfNormalizado);
            return obj.orElseThrow(() -> new ObjectNotFoundException("Usuário não encontrado com CPF: " + cpf));
        } catch (Exception e) {
            throw new RuntimeException("Erro ao buscar idoso com CPF: " + cpf + " - " + e.getMessage());
        }
    }

    public Idoso criar(Idoso obj) {
        try {
            if (obj.getCuidador() != null && obj.getCuidador().getCpf() != null) {
                Cuidador cuidador = recuperarCuidador(obj.getCuidador().getCpf());
                obj.setCuidador(cuidador);
            }

            obj.refreshImc();
            return repository.save(obj);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Erro de integridade ao salvar o idoso: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("Erro ao salvar o idoso: " + e.getMessage());
        }
    }

    public Idoso atualizar(String cpf, Idoso novoIdoso) {
        try {
            Idoso existente = buscarPorCpf(cpf);

            existente.setNome(novoIdoso.getNome());
            existente.setRg(novoIdoso.getRg());
            existente.setEmail(novoIdoso.getEmail());
            existente.setDataNascimento(novoIdoso.getDataNascimento());
            existente.setTelefone(novoIdoso.getTelefone());
            existente.setPeso(novoIdoso.getPeso());
            existente.setAltura(novoIdoso.getAltura());
            existente.setTipoSanguineo(novoIdoso.getTipoSanguineo());
            existente.setObservacao(novoIdoso.getObservacao());
            existente.getEnderecos().clear();
            if (novoIdoso.getEnderecos() != null) {
                existente.getEnderecos().addAll(novoIdoso.getEnderecos());
            }
            existente.setImc(novoIdoso.getImc());

            if (novoIdoso.getCuidador() != null && novoIdoso.getCuidador().getCpf() != null) {
                Cuidador cuidador = recuperarCuidador(novoIdoso.getCuidador().getCpf());
                existente.setCuidador(cuidador);
            } else if (novoIdoso.getCuidador() == null) {
                existente.setCuidador(null);
            }

            existente.refreshImc();

            return repository.save(existente);
        } catch (ObjectNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Erro ao atualizar idoso com CPF: " + cpf + " - " + e.getMessage());
        }
    }

    public Idoso atribuirCuidador(String idosoCpf, String cuidadorCpf) {
        java.util.Objects.requireNonNull(idosoCpf, "CPF do idoso não pode ser nulo");
        java.util.Objects.requireNonNull(cuidadorCpf, "CPF do cuidador não pode ser nulo");
        Idoso idoso = buscarPorCpf(idosoCpf);
        Cuidador cuidador = recuperarCuidador(cuidadorCpf);
        idoso.setCuidador(cuidador);
        return repository.save(idoso);
    }

    public Idoso removerCuidador(String idosoCpf) {
        java.util.Objects.requireNonNull(idosoCpf, "CPF do idoso não pode ser nulo");
        Idoso idoso = buscarPorCpf(idosoCpf);
        idoso.setCuidador(null);
        return repository.save(idoso);
    }


    public void deletar(String cpf) {
        try {
            java.util.Objects.requireNonNull(cpf, "CPF não pode ser nulo");
            Idoso existente = buscarPorCpf(cpf); // garante que existe com CPF normalizado
            String cpfValido = java.util.Objects.requireNonNull(existente.getCpf(), "CPF do idoso não pode ser nulo");
            repository.deleteById(cpfValido);
        } catch (ObjectNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Erro ao deletar idoso com CPF: " + cpf + " - " + e.getMessage());
        }
    }

    private Cuidador recuperarCuidador(String cuidadorCpf) {
        java.util.Objects.requireNonNull(cuidadorCpf, "CPF do cuidador não pode ser nulo");
        String cpfNormalizado = normalizarCpf(cuidadorCpf);

        if (cpfNormalizado == null || cpfNormalizado.isBlank()) {
            throw new ObjectNotFoundException("CPF do cuidador inválido: " + cuidadorCpf);
        }

        Optional<Cuidador> existente = cuidadorRepository.findById(cpfNormalizado);
        if (existente.isPresent()) {
            return existente.get();
        }

        Usuario usuario = usuarioRepository.findByCpf(cpfNormalizado)
                .filter(u -> u.getRole() == Role.ROLE_CUIDADOR)
                .orElseThrow(() -> new ObjectNotFoundException("Cuidador não encontrado com CPF: " + cuidadorCpf));

        Cuidador novo = new Cuidador();
        novo.setCpf(usuario.getCpf());
        novo.setNome(Optional.ofNullable(usuario.getNome()).filter(n -> !n.isBlank()).orElse("Cuidador"));
        novo.setEmail(usuario.getEmail());
        return cuidadorRepository.save(novo);
    }

    private String normalizarCpf(String cpf) {
        if (cpf == null) {
            return null;
        }
        String apenasDigitos = cpf.replaceAll("\\D", "");
        if (apenasDigitos.length() == 11) {
            return apenasDigitos;
        }
        return cpf.trim();
    }
}
