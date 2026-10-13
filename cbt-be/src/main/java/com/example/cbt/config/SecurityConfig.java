package com.example.cbt.config;

import com.example.cbt.auth.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

  private final JwtAuthFilter jwtAuthFilter;
  private final CorsConfigurationSource corsConfigurationSource; // ★ 주입
  private final com.example.cbt.auth.CustomOAuth2UserService customOAuth2UserService;
  private final com.example.cbt.auth.OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
  private final org.springframework.beans.factory.ObjectProvider<
          org.springframework.security.oauth2.client.registration.ClientRegistrationRepository>
      registrations;

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.csrf(csrf -> csrf.disable())
        .securityContext(
            context ->
                context.securityContextRepository(
                    new org.springframework.security.web.context
                        .RequestAttributeSecurityContextRepository()))
        .sessionManagement(
            session ->
                session.sessionCreationPolicy(
                    org.springframework.security.config.http.SessionCreationPolicy.IF_REQUIRED))
        .cors(cors -> cors.configurationSource(corsConfigurationSource))
        .exceptionHandling(
            e ->
                e.authenticationEntryPoint(
                    new org.springframework.security.web.authentication.HttpStatusEntryPoint(
                        org.springframework.http.HttpStatus.UNAUTHORIZED)))
        .authorizeHttpRequests(
            auth ->
                auth.dispatcherTypeMatchers(
                        jakarta.servlet.DispatcherType.FORWARD,
                        jakarta.servlet.DispatcherType.ERROR)
                    .permitAll()
                    // Series reads are public; mutations require an administrator.
                    .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/series/**")
                    .hasAuthority("ROLE_ADMIN")
                    .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/series/**")
                    .hasAuthority("ROLE_ADMIN")
                    .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/series/**")
                    .hasAuthority("ROLE_ADMIN")
                    // --- Admin Endpoints (most specific) ---
                    .requestMatchers("/api/admin/**")
                    .hasAuthority("ROLE_ADMIN")
                    .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/exams/all")
                    .hasAuthority("ROLE_ADMIN")
                    .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/exams")
                    .hasAuthority("ROLE_ADMIN")
                    .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/exams/**")
                    .hasAuthority("ROLE_ADMIN")
                    .requestMatchers(org.springframework.http.HttpMethod.PATCH, "/api/exams/**")
                    .hasAuthority("ROLE_ADMIN")
                    .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/exams/**")
                    .hasAuthority("ROLE_ADMIN")
                    // New Admin-only endpoint for fetching questions with answers
                    .requestMatchers(
                        org.springframework.http.HttpMethod.GET, "/api/exams/*/questions/admin")
                    .hasAuthority("ROLE_ADMIN")

                    // Explicitly secure the history endpoint BEFORE the wildcard permitAll
                    .requestMatchers("/api/attempts/history")
                    .authenticated()

                    // --- Public Endpoints ---
                    .requestMatchers(
                        "/error",
                        "/swagger-ui/**",
                        "/v3/api-docs/**",
                        "/api/auth/signup",
                        "/api/auth/login",
                        "/api/auth/refresh",
                        "/api/auth/oauth/exchange",
                        "/api/auth/providers",
                        "/api/auth/logout",
                        "/actuator/health",
                        "/api/series/**",
                        "/api/ranking/**",
                        "/api/attempts/**")
                    .permitAll()

                    // Allow viewing exams to everyone (this is safe because admin rules for exams
                    // are already defined above)
                    .requestMatchers(
                        org.springframework.http.HttpMethod.GET,
                        "/api/exams",
                        "/api/exams/**",
                        "/api/ranking/**",
                        "/api/question-images/**")
                    .permitAll()

                    // --- All other requests must be authenticated ---
                    // This will protect user-specific endpoints like /api/attempts/history
                    .anyRequest()
                    .authenticated())
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

    if (registrations.getIfAvailable() != null) {
      http.oauth2Login(
          oauth ->
              oauth
                  .userInfoEndpoint(info -> info.userService(customOAuth2UserService))
                  .successHandler(oAuth2LoginSuccessHandler));
    }
    return http.build();
  }

  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration)
      throws Exception {
    return configuration.getAuthenticationManager();
  }
}
