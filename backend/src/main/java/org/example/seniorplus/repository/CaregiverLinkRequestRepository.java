package org.example.seniorplus.repository;

import org.example.seniorplus.domain.CaregiverLinkRequest;
import org.example.seniorplus.domain.CaregiverLinkStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CaregiverLinkRequestRepository extends JpaRepository<CaregiverLinkRequest, Long> {
    List<CaregiverLinkRequest> findByIdosoCpfAndStatusOrderByCreatedAtDesc(String idosoCpf, CaregiverLinkStatus status);

    List<CaregiverLinkRequest> findByCuidadorCpfOrderByCreatedAtDesc(String cuidadorCpf);

    Optional<CaregiverLinkRequest> findTopByIdosoCpfAndCuidadorCpfAndStatus(String idosoCpf, String cuidadorCpf, CaregiverLinkStatus status);
}
