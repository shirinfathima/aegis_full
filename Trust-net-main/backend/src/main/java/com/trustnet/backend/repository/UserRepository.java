package com.trustnet.backend.repository;

import com.trustnet.backend.entity.User;
import com.trustnet.backend.model.Role; // Make sure Role is imported
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    User findByEmail(String email);

    // NEW: Find all users with a specific role
    List<User> findByRole(Role role);
}

