package com.example.cbt.auth;

import com.example.cbt.user.Role;
import com.example.cbt.user.User;
import com.example.cbt.user.UserRepository;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

  private final UserRepository userRepository;

  @Override
  @Transactional
  public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
    OAuth2User oAuth2User = super.loadUser(userRequest);
    String registrationId = userRequest.getClientRegistration().getRegistrationId();

    log.info("OAuth2 Login Request: provider={}", registrationId);

    String userNameAttributeName =
        userRequest
            .getClientRegistration()
            .getProviderDetails()
            .getUserInfoEndpoint()
            .getUserNameAttributeName();

    Map<String, Object> attributes = oAuth2User.getAttributes();
    OAuthAttributes oAuthAttributes =
        OAuthAttributes.of(registrationId, userNameAttributeName, attributes);

    User user = saveOrUpdate(oAuthAttributes);

    // We can add the userId to the attributes so the handler can use it easily
    Map<String, Object> newAttributes = new java.util.HashMap<>(attributes);
    newAttributes.put("userId", user.getId());
    newAttributes.put("role", user.getRole());
    newAttributes.put("username", user.getUsername());

    return new DefaultOAuth2User(
        Collections.singleton(
            new org.springframework.security.core.authority.SimpleGrantedAuthority(
                user.getRole().name())),
        newAttributes,
        "userId");
  }

  private User saveOrUpdate(OAuthAttributes attributes) {
    return userRepository
        .findByProviderAndProviderId(attributes.getProvider(), attributes.getProviderId())
        .orElseGet(
            () -> {
              if (attributes.getEmail() != null
                  && userRepository.findByEmail(attributes.getEmail()).isPresent()) {
                throw new OAuth2AuthenticationException("이 이메일의 계정이 이미 있습니다. 기존 로그인 방식을 사용해주세요.");
              }
              return userRepository.save(
                  User.builder()
                      .username("oauth_" + UUID.randomUUID().toString().replace("-", ""))
                      .email(attributes.getEmail())
                      .role(Role.ROLE_USER)
                      .provider(attributes.getProvider())
                      .providerId(attributes.getProviderId())
                      .build());
            });
  }
}
