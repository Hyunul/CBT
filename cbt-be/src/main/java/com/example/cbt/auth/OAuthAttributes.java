package com.example.cbt.auth;

import java.util.Map;
import lombok.Builder;
import lombok.Getter;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;

@Getter
@Builder
public class OAuthAttributes {
  private Map<String, Object> attributes;
  private String nameAttributeKey;
  private String name;
  private String email;
  private String provider;
  private String providerId;

  public static OAuthAttributes of(
      String registrationId, String userNameAttributeName, Map<String, Object> attributes) {
    Map<?, ?> account;
    Map<?, ?> profile;
    Object id;
    switch (registrationId) {
      case "google" -> {
        account = attributes;
        profile = attributes;
        id = attributes.get("sub");
      }
      case "kakao" -> {
        account = nested(attributes, "kakao_account");
        profile = nested(account, "profile");
        id = attributes.get("id");
      }
      case "naver" -> {
        account = nested(attributes, "response");
        profile = account;
        id = account.get("id");
      }
      default -> throw new OAuth2AuthenticationException("unsupported_provider");
    }
    if (!(id instanceof String || id instanceof Number) || id.toString().isBlank()) {
      throw new OAuth2AuthenticationException("missing_provider_id");
    }
    return OAuthAttributes.builder()
        .attributes(attributes)
        .nameAttributeKey(userNameAttributeName)
        .provider(registrationId)
        .providerId(id.toString())
        .name(text(profile.get("kakao".equals(registrationId) ? "nickname" : "name")))
        .email(text(account.get("email")))
        .build();
  }

  private static Map<?, ?> nested(Map<?, ?> values, String key) {
    return values.get(key) instanceof Map<?, ?> map ? map : Map.of();
  }

  private static String text(Object value) {
    return value instanceof String text && !text.isBlank() ? text : null;
  }
}
