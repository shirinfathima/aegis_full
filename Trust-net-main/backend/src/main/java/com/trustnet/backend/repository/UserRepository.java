package com.trustnet.backend.repository;

import com.trustnet.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import com.trustnet.backend.model.Role; 
import java.util.List;
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    User findByEmail(String email);
    List<User> findByRole(Role role);
}

