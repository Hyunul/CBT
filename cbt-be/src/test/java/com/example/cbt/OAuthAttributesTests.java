package com.example.cbt;

import static org.junit.jupiter.api.Assertions.*;

import com.example.cbt.auth.OAuthAttributes;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;

class OAuthAttributesTests {
  @Test
  void optionalKakaoProfileCanBeAbsent() {
    var account = OAuthAttributes.of("kakao", "id", Map.of("id", 1234L));
    assertEquals("1234", account.getProviderId());
    assertNull(account.getEmail());
    assertNull(account.getName());
  }

  @Test
  void missingProviderIdCannotCreateSharedNullIdentity() {
    for (String provider : new String[] {"google", "kakao", "naver", "unknown"}) {
      assertThrows(
          OAuth2AuthenticationException.class, () -> OAuthAttributes.of(provider, "id", Map.of()));
    }
  }

  @Test
  void naverNestedIdentityIsRead() {
    var account =
        OAuthAttributes.of(
            "naver",
            "response",
            Map.of("response", Map.of("id", "naver-id", "email", "user@example.com")));
    assertEquals("naver-id", account.getProviderId());
    assertEquals("user@example.com", account.getEmail());
  }
}
