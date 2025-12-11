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

    // [수정됨]: email 대신 username과 password를 파라미터로 받습니다.
    public LoginRes login(String username, String password) {
        // [수정됨]: findByEmail 대신 findByUsername 사용
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다. (Username 불일치)"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("비밀번호 불일치");
        }
        
        // 토큰 생성 및 반환 로직은 동일
        String token = jwtUtil.generateToken(user.getId(), user.getRole().name());
        return new LoginRes(token, user.getId(), user.getUsername(), user.getRole().name());
    }
}