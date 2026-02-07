package com.trustnet.backend.config;

import com.trustnet.backend.service.CustomUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod; // Import this
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;

    public SecurityConfig(CustomUserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable()) // Disable CSRF for external API calls
            .authorizeHttpRequests(auth -> auth
                // 1. Public Endpoints
                .requestMatchers(
                    "/api/user/register", 
                    "/api/user/login", 
                    "/api/user/issuers", 
                    "/uploads/**"
                ).permitAll()

                // 2. 👇 ALLOW USERS TO SUBMIT PROOFS TO VERIFIERS 👇
                // This specific endpoint must be accessible by USER (and VERIFIER)
                .requestMatchers("/api/verifier/submit-proof").hasAnyRole("USER", "VERIFIER")

                // 3. Verifier-Only Endpoints (Everything else under /api/verifier)
                .requestMatchers("/api/verifier/**").hasRole("VERIFIER")
                
                // 4. Issuer-Only Endpoints
                .requestMatchers("/api/issuer/**").hasRole("ISSUER")
                
                // 5. User Endpoints
                .requestMatchers("/api/user/**").hasAnyRole("USER", "VERIFIER", "ISSUER")
                
                // 6. Document Endpoints
                .requestMatchers("/api/documents/**").authenticated() // Allow any logged-in user

                .anyRequest().authenticated()
            )
            .httpBasic(Customizer.withDefaults()); // Enable Basic Auth

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    // CORS Configuration to allow React Frontend
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOrigins(List.of("http://localhost:3000")); // React URL
        config.setAllowedHeaders(Arrays.asList("Origin", "Content-Type", "Accept", "Authorization"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}