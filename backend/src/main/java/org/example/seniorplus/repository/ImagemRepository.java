package org.example.seniorplus.repository;

import org.example.seniorplus.domain.Imagem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ImagemRepository extends JpaRepository<Imagem, Long> {
    List<Imagem> findAllByCpf(String cpf);
}
