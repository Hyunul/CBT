package com.example.cbt.user;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByProviderAndProviderId(String provider, String providerId);

  Optional<User> findByEmail(String email);

  Optional<User> findByUsername(String username);

  Optional<User> findByUsernameOrEmail(String username, String email);
}
