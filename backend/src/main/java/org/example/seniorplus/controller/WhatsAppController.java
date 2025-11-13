package org.example.seniorplus.controller;

import org.example.seniorplus.config.ZapWhatsAppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/whatsapp")
@CrossOrigin(origins = "http://localhost:3000")
public class WhatsAppController {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppController.class);
    private static final String API_URL = "https://api.callmebot.com/whatsapp.php";

    @Autowired
    private RestTemplate restTemplate;

    @Autowired(required = false)
    private ZapWhatsAppProperties zapWhatsAppProperties;

    public static class SendRequest {
        public String phone;
        public String message;

        public SendRequest() {}

        public SendRequest(String phone, String message) {
            this.phone = phone;
            this.message = message;
        }
    }

    @PostMapping("/send")
    public ResponseEntity<String> sendWhatsApp(@RequestBody SendRequest req) {
        if (req == null || req.phone == null || req.phone.isEmpty() || req.message == null) {
            return ResponseEntity.badRequest().body("phone and message are required");
        }

        String apiKey = null;
        if (zapWhatsAppProperties != null && zapWhatsAppProperties.getApiKey() != null && !zapWhatsAppProperties.getApiKey().isEmpty()) {
            apiKey = zapWhatsAppProperties.getApiKey();
        }

        try {
            String encodedMessage = URLEncoder.encode(req.message, StandardCharsets.UTF_8.toString());
            String url = API_URL + "?phone=" + URLEncoder.encode(req.phone, StandardCharsets.UTF_8.toString()) + "&text=" + encodedMessage;
            if (apiKey != null) {
                url += "&apikey=" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8.toString());
            }

            logger.info("Sending WhatsApp message via callmebot to phone={}", req.phone);
            String resp = restTemplate.getForObject(url, String.class);
            return ResponseEntity.ok(resp == null ? "" : resp);
        } catch (RestClientException ex) {
            logger.error("error sending whatsapp message", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("error sending message");
        } catch (Exception ex) {
            logger.error("error preparing whatsapp request", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("error preparing request");
        }
    }
}
