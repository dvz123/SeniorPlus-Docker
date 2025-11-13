package org.example.seniorplus;

import org.example.seniorplus.service.WhatsAppNotificationService;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class ApplicationStartup {

    private final WhatsAppNotificationService notificationService;

    public ApplicationStartup(WhatsAppNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        notificationService.verificarEEnviarMensagens();
    }
}
