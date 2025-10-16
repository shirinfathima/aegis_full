package com.trustnet.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer; // Import for disable()
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable) // Use modern lambda syntax to disable CSRF
            .authorizeHttpRequests(auth -> auth
                // Public Endpoints (Registration & Login) - No Auth Required
                .requestMatchers("/api/user/register", "/api/user/login").permitAll()
                
                // Role-Specific Endpoints
                // Only USER role can upload documents
                .requestMatchers("/api/upload/**").hasAuthority("USER")
                // Only VERIFIER role can access verifier endpoints
                .requestMatchers("/api/verifier/**").hasAuthority("VERIFIER")
                // Only ISSUER role can access issuer endpoints
                .requestMatchers("/api/issuer/**").hasAuthority("ISSUER")
                
                // All other requests MUST be authenticated (logged in)
                .anyRequest().authenticated()
            )
            .httpBasic(); // Enable HTTP Basic Auth for simplicity

        return http.build();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}