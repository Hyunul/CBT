package com.example.cbt.auth;

import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.cbt.auth.dto.LoginRes;
import com.example.cbt.user.User;
import com.example.cbt.user.UserRepository;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final StringRedisTemplate redisTemplate;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    // [수정됨]: email 대신 username과 password를 파라미터로 받습니다.
    public LoginRes login(String username, String password) {
        // [수정됨]: findByEmail 대신 findByUsername 사용
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다. (Username 불일치)"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("비밀번호 불일치");
        }
        
        String accessToken = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());

        // Save Refresh Token to Redis
        redisTemplate.opsForValue().set(
                "RT:" + user.getId(),
                refreshToken,
                refreshExpiration,
                TimeUnit.MILLISECONDS
        );

        return new LoginRes(accessToken, refreshToken, user.getId(), user.getUsername(), user.getRole().name());
    }

    public LoginRes refreshToken(String refreshToken) {
        // 1. Verify token signature and expiration
        Claims claims = jwtUtil.parseToken(refreshToken).getBody();
        String userIdStr = claims.getSubject();
        Long userId = Long.parseLong(userIdStr);

        // 2. Check if token exists in Redis
        String storedToken = redisTemplate.opsForValue().get("RT:" + userId);
        if (storedToken == null || !storedToken.equals(refreshToken)) {
            throw new RuntimeException("유효하지 않은 Refresh Token입니다.");
        }

        // 3. Find user to get role (needed for new access token)
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 4. Generate new Access Token & Refresh Token (RTR)
        String newAccessToken = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole().name());
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getId());

        // 5. Update Redis with new Refresh Token (Rotate)
        redisTemplate.opsForValue().set(
                "RT:" + userId,
                newRefreshToken,
                refreshExpiration,
                TimeUnit.MILLISECONDS
        );
        
        return new LoginRes(newAccessToken, newRefreshToken, user.getId(), user.getUsername(), user.getRole().name());
    }

    public void logout(Long userId) {
        redisTemplate.delete("RT:" + userId);
    }
}