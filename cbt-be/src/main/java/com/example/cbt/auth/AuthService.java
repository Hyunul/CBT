package com.example.cbt.auth;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.cbt.auth.dto.LoginRes;
import com.example.cbt.user.User;
import com.example.cbt.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginRes login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("비밀번호 불일치");
        }
        String token = jwtUtil.generateToken(user.getId(), user.getRole().name());
        return new LoginRes(token, user.getId(), user.getRole().name());
    }
}
