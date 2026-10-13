package com.example.cbt.auth;

import jakarta.servlet.http.*;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
  private final AuthService authService;

  @Value("${app.frontend-url}")
  private String frontendUrl;

  @Override
  public void onAuthenticationSuccess(
      HttpServletRequest request, HttpServletResponse response, Authentication authentication)
      throws IOException {
    OAuth2User user = (OAuth2User) authentication.getPrincipal();
    String code = authService.createOAuthCode(user.getAttribute("userId"));
    if (request.getSession(false) != null) request.getSession(false).invalidate();
    String target =
        UriComponentsBuilder.fromUriString(frontendUrl + "/login/oauth2/callback")
            .fragment("code=" + code)
            .build()
            .toUriString();
    getRedirectStrategy().sendRedirect(request, response, target);
  }
}
