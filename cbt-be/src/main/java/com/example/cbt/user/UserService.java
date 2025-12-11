package com.example.cbt.user;

import java.time.Instant;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User register(String email, String username, String password, String roleStr) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("이미 존재하는 이메일입니다.");
        }

        Role role;
        if ("ADMIN".equalsIgnoreCase(roleStr) || "ROLE_ADMIN".equalsIgnoreCase(roleStr)) {
            role = Role.ROLE_ADMIN;
        } else {
            // Default to USER for CANDIDATE or others
            role = Role.ROLE_USER;
        }

        User newUser = User.builder()
                .email(email)
                .username(username)
                .password(passwordEncoder.encode(password)) 
                .role(role)
                .build();

        return userRepository.save(newUser);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
