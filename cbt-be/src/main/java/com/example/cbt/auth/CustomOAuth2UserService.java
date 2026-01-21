package com.example.cbt.auth;

import com.example.cbt.user.Role;
import com.example.cbt.user.User;
import com.example.cbt.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Map;
import java.util.UUID;

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

        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        Map<String, Object> attributes = oAuth2User.getAttributes();
        OAuthAttributes oAuthAttributes = OAuthAttributes.of(registrationId, userNameAttributeName, attributes);

        User user = saveOrUpdate(oAuthAttributes);

        // We can add the userId to the attributes so the handler can use it easily
        Map<String, Object> newAttributes = new java.util.HashMap<>(attributes);
        newAttributes.put("userId", user.getId());
        newAttributes.put("role", user.getRole());
        newAttributes.put("username", user.getUsername());

        return new DefaultOAuth2User(
                Collections.singleton(new org.springframework.security.core.authority.SimpleGrantedAuthority(user.getRole().name())),
                newAttributes,
                userNameAttributeName
        );
    }

    private User saveOrUpdate(OAuthAttributes attributes) {
        User user = userRepository.findByEmail(attributes.getEmail())
                .map(entity -> entity.getEmail().equals(attributes.getEmail()) ? entity : entity) // Update logic if needed
                .orElse(User.builder()
                        .username(attributes.getName() + "_" + UUID.randomUUID().toString().substring(0, 8)) // Ensure unique username
                        .email(attributes.getEmail())
                        .password("") // No password for OAuth users
                        .role(Role.ROLE_USER)
                        .provider(attributes.getProvider())
                        .providerId(attributes.getProviderId())
                        .build());

        // Update provider info if it was existing user but maybe not linked (simple case: just update)
        if (user.getProvider() == null) {
            user.setProvider(attributes.getProvider());
            user.setProviderId(attributes.getProviderId());
        }

        return userRepository.save(user);
    }
}
