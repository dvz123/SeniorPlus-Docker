package org.example.seniorplus.service;

import org.example.seniorplus.domain.Idoso;
import org.example.seniorplus.domain.Medicamento;
import org.example.seniorplus.repository.IdosoRepository;
import org.example.seniorplus.repository.MedicamentoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalTime;
import java.util.List;

@Service
public class WhatsAppNotificationService {

    private final MedicamentoRepository medicamentoRepository;
    private final IdosoRepository idosoRepository;
    private final RestTemplate restTemplate;
    private static final String API_URL = "https://api.callmebot.com/whatsapp.php";

    public WhatsAppNotificationService(MedicamentoRepository medicamentoRepository,
                                       IdosoRepository idosoRepository,
                                       RestTemplate restTemplate) {
        this.medicamentoRepository = medicamentoRepository;
        this.idosoRepository = idosoRepository;
        this.restTemplate = restTemplate;
    }

    @Transactional(readOnly = true)
    @Scheduled(fixedRate = 60000) // Executa a cada 1 minuto
    public void verificarEEnviarMensagens() {
        LocalTime agora = LocalTime.now().withSecond(0).withNano(0);
        System.out.println("🔍 Verificando horários às: " + agora);

        List<Medicamento> medicamentos = medicamentoRepository.findAll();

        for (Medicamento medicamento : medicamentos) {
            try {
                List<LocalTime> proximosHorarios = medicamento.gerarHorariosNasProximas2Horas();

                for (LocalTime horario : proximosHorarios) {
                    if (horario.equals(agora)) {
                        enviarMensagem(medicamento);
                        break; // Evita múltiplos envios no mesmo minuto
                    }
                }
            } catch (Exception e) {
                System.err.println("❌ Erro ao processar horário do medicamento: " + e.getMessage());
                e.printStackTrace();
            }
        }
    }

    private void enviarMensagem(Medicamento medicamento) {
        String cpf = medicamento.getCpf(); // Obtém o CPF associado ao medicamento
        if (cpf == null) {
            System.err.println("❌ Erro: CPF não encontrado no medicamento.");
            return;
        }

        // Busca o idoso pelo CPF
        Idoso idoso = idosoRepository.findById(cpf).orElse(null);
        if (idoso == null) {
            System.err.println("❌ Erro: Idoso não encontrado com CPF: " + cpf);
            return;
        }

        String telefone = idoso.getTelefone();
        String apiKey = idoso.getObservacao(); // Ajuste se a API Key estiver salva em outro campo
        String mensagemAlternativa = medicamento.getInstrucoes();

        if (apiKey == null || apiKey.isEmpty()) {
            System.err.println("❌ Erro: API Key do idoso está vazia ou nula!");
            return;
        }

        String mensagem = (mensagemAlternativa != null && !mensagemAlternativa.trim().isEmpty())
                ? mensagemAlternativa
                : "💊 *Lembrete de Medicamento!*\n" +
                "📌 *Medicamento:* " + medicamento.getNomeMedicamento() + "\n" +
                "🔔 *Não se esqueça de tomar seu remédio!*";

        // Monta a URL para a API do WhatsApp
        String url = API_URL + "?phone=" + telefone + "&text=" + mensagem + "&apikey=" + apiKey;

        System.out.println("📤 Enviando mensagem para: " + telefone);
        System.out.println("🔗 URL: " + url);

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            System.out.println("✅ Resposta da API: " + response.getBody());
        } catch (Exception e) {
            System.err.println("❌ Erro ao enviar mensagem: " + e.getMessage());
        }
    }
}
