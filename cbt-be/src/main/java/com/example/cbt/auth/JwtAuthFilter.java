package com.example.cbt.auth;

import com.example.cbt.user.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
  private final JwtUtil jwtUtil;
  private final UserRepository users;
  private final AuthService authService;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    String header = request.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
      try {
        Claims claims = jwtUtil.parse(header.substring(7), "access");
        Long id = Long.valueOf(claims.getSubject());
        if (!authService.isActive(id, claims.get("session", String.class)))
          throw new JwtException("Session revoked");
        CustomUserDetails user =
            new CustomUserDetails(
                users.findById(id).orElseThrow(() -> new JwtException("User missing")));
        SecurityContextHolder.getContext()
            .setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
      } catch (JwtException | IllegalArgumentException e) {
        fail(response, 401, "인증이 만료되었습니다.");
        return;
      } catch (DataAccessException e) {
        fail(response, 503, "인증 서비스를 일시적으로 사용할 수 없습니다.");
        return;
      }
    }
    chain.doFilter(request, response);
  }

  private void fail(HttpServletResponse response, int status, String message) throws IOException {
    SecurityContextHolder.clearContext();
    response.setStatus(status);
    response.setContentType("application/json;charset=UTF-8");
    response.getWriter().write("{\"success\":false,\"message\":\"" + message + "\"}");
  }
}
