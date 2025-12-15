package com.example.cbt.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

import com.example.cbt.auth.JwtAuthFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CorsConfigurationSource corsConfigurationSource; // ★ 주입

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .authorizeHttpRequests(auth -> auth
                    // --- Admin Endpoints (most specific) ---
                    .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
                    .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/exams/all").hasAuthority("ROLE_ADMIN")
                    .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/exams").hasAuthority("ROLE_ADMIN")
                    .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/exams/**").hasAuthority("ROLE_ADMIN")
                    .requestMatchers(org.springframework.http.HttpMethod.PATCH, "/api/exams/**").hasAuthority("ROLE_ADMIN")
                    .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/exams/**").hasAuthority("ROLE_ADMIN")
                    // New Admin-only endpoint for fetching questions with answers
                    .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/exams/*/questions/admin").hasAuthority("ROLE_ADMIN")

                    // --- Public Endpoints ---
                    .requestMatchers(
                            "/swagger-ui/**",
                            "/v3/api-docs/**",
                            "/api/auth/signup",
                            "/api/auth/login",
                            "/api/series/**"
                    ).permitAll()
                    // Explicitly secure the history endpoint BEFORE the wildcard permitAll
                    .requestMatchers("/api/attempts/history").authenticated()
                    
                    // Allow viewing exams to everyone (this is safe because admin rules for exams are already defined above)
                    .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/exams", "/api/exams/**", "/api/ranking/**").permitAll()

                    // --- All other requests must be authenticated ---
                    // This will protect user-specific endpoints like /api/attempts/history
                    .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
