package org.example.seniorplus.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.springframework.lang.NonNull;


@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    public void enviarEmailResetSenha(@NonNull String destinatario,@NonNull String token) throws MessagingException {
        Context context = new Context();
        context.setVariable("token", token);
        String conteudo = templateEngine.process("reset-senha", context);

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setTo(destinatario);
        helper.setSubject("Redefinição de Senha");
        helper.setText(conteudo, true);
        
        mailSender.send(message);
    }
} 