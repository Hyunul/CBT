package com.example.cbt.user;

import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  @Transactional
  public User register(String email, String username, String password, String roleStr) {
    if (userRepository.findByEmail(email).isPresent()) {
      throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "이미 존재하는 이메일입니다.");
    }

    if (userRepository.findByUsername(username).isPresent()) {
      throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "이미 존재하는 아이디입니다.");
    }
    Role role = Role.ROLE_USER;

    User newUser =
        User.builder()
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
