package org.example.seniorplus.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayRepairConfig {

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return new FlywayMigrationStrategy() {
            @Override
            public void migrate(Flyway flyway) {
                try {
                    // Tenta reparar histórico (checksums, estados pendentes)
                    flyway.repair();
                } catch (Exception ignored) {
                    // ignora erro de repair para não impedir o start
                }
                // Em seguida, executa as migrações normalmente
                flyway.migrate();
            }
        };
    }
}
