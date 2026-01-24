package com.trustnet.backend.repository;

import com.trustnet.backend.entity.AccessRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AccessRequestRepository extends JpaRepository<AccessRequest, Long> {
    
  List<AccessRequest> findByVerifierEmail(String verifierEmail);
  List<AccessRequest> findByUserEmail(String userEmail);
}