package com.example.cbt.auth;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {
  private final Key key;
  private final long expiration;
  private final long refreshExpiration;

  public JwtUtil(
      @Value("${jwt.secret}") String secret,
      @Value("${jwt.expiration}") long expiration,
      @Value("${jwt.refresh-expiration}") long refreshExpiration) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.expiration = expiration;
    this.refreshExpiration = refreshExpiration;
  }

  public String generateToken(Long id, String username, String role, String session) {
    return builder(id, "access", session, expiration)
        .claim("username", username)
        .claim("role", role)
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  public String generateRefreshToken(Long id, String session) {
    return builder(id, "refresh", session, refreshExpiration)
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  private JwtBuilder builder(Long id, String type, String session, long ttl) {
    return Jwts.builder()
        .setSubject(id.toString())
        .setId(UUID.randomUUID().toString())
        .claim("type", type)
        .claim("session", session)
        .setIssuedAt(new Date())
        .setExpiration(new Date(System.currentTimeMillis() + ttl));
  }

  public Claims parse(String token, String type) {
    Claims claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    if (!type.equals(claims.get("type")) || claims.get("session", String.class) == null) {
      throw new JwtException("Invalid token type");
    }
    return claims;
  }
}
