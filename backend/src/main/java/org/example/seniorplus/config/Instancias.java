package org.example.seniorplus.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

@Configuration
public class Instancias implements CommandLineRunner {

    @Override
    public void run(String... args) throws Exception {
        // Inicialização do banco de dados - sem dados predefinidos
        // Os dados serão inseridos através das APIs
    }
}
