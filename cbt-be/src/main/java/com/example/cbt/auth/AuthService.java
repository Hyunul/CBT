package com.example.cbt.auth;

import com.example.cbt.auth.dto.LoginRes;
import com.example.cbt.user.User;
import com.example.cbt.user.UserRepository;
import io.jsonwebtoken.Claims;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;
  private final StringRedisTemplate redis;

  @Value("${jwt.refresh-expiration}")
  private long refreshExpiration;

  private static final DefaultRedisScript<Long> ISSUE =
      new DefaultRedisScript<>(
          "redis.call('HSET',KEYS[1],'refresh',ARGV[1],'session',ARGV[2]);"
              + " redis.call('PEXPIRE',KEYS[1],ARGV[3]); return 1",
          Long.class);
  private static final DefaultRedisScript<Long> ROTATE =
      new DefaultRedisScript<>(
          "if redis.call('HGET',KEYS[1],'refresh') ~= ARGV[1] then return 0 end;"
              + " redis.call('HSET',KEYS[1],'refresh',ARGV[2]);"
              + " redis.call('PEXPIRE',KEYS[1],ARGV[3]); return 1",
          Long.class);

  public LoginRes login(String username, String password) {
    User user = userRepository.findByUsername(username).orElseThrow(this::unauthorized);
    if (user.getPassword() == null || !passwordEncoder.matches(password, user.getPassword()))
      throw unauthorized();
    return issue(user);
  }

  public LoginRes issue(User user) {
    String session = UUID.randomUUID().toString();
    LoginRes result = tokens(user, session);
    redis.execute(
        ISSUE,
        List.of(key(user.getId())),
        result.refreshToken(),
        session,
        String.valueOf(refreshExpiration));
    return result;
  }

  private LoginRes tokens(User user, String session) {
    return new LoginRes(
        jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole().name(), session),
        jwtUtil.generateRefreshToken(user.getId(), session),
        user.getId(),
        user.getUsername(),
        user.getRole().name());
  }

  public LoginRes refreshToken(String token) {
    Claims claims = jwtUtil.parse(token, "refresh");
    Long id = Long.valueOf(claims.getSubject());
    User user = userRepository.findById(id).orElseThrow(this::unauthorized);
    LoginRes result = tokens(user, claims.get("session", String.class));
    Long rotated =
        redis.execute(
            ROTATE,
            List.of(key(id)),
            token,
            result.refreshToken(),
            String.valueOf(refreshExpiration));
    if (!Long.valueOf(1).equals(rotated)) throw unauthorized();
    return result;
  }

  public boolean isActive(Long userId, String session) {
    return session.equals(redis.opsForHash().get(key(userId), "session"));
  }

  public void logoutToken(String token) {
    Claims claims = jwtUtil.parse(token, "refresh");
    var script =
        new DefaultRedisScript<Long>(
            "if redis.call('HGET',KEYS[1],'session') == ARGV[1] then return"
                + " redis.call('DEL',KEYS[1]) end; return 0",
            Long.class);
    redis.execute(
        script,
        List.of(key(Long.valueOf(claims.getSubject()))),
        claims.get("session", String.class));
  }

  public String createOAuthCode(Long userId) {
    String code = UUID.randomUUID().toString();
    redis.opsForValue().set("oauth:" + code, userId.toString(), Duration.ofSeconds(60));
    return code;
  }

  public LoginRes exchangeOAuthCode(String code) {
    String id = redis.opsForValue().getAndDelete("oauth:" + code);
    if (id == null) throw unauthorized();
    return issue(userRepository.findById(Long.valueOf(id)).orElseThrow(this::unauthorized));
  }

  private String key(Long id) {
    return "auth:" + id;
  }

  private ResponseStatusException unauthorized() {
    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다.");
  }
}
