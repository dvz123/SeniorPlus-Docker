package org.example.seniorplus.service;

import org.example.seniorplus.domain.Mensagem;
import org.example.seniorplus.repository.MensagemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.time.LocalDateTime;

@Service
public class MensagemService {
    
    @Autowired
    private MensagemRepository mensagemRepository;

    public List<Mensagem> getMensagensDoIdoso(Long idosoId) {
        return mensagemRepository.findByIdosoIdOrderByDataHoraDesc(idosoId);
    }

    public Mensagem salvarMensagem(Mensagem mensagem) {
        mensagem.setDataHora(LocalDateTime.now());
        return mensagemRepository.save(mensagem);
    }
}