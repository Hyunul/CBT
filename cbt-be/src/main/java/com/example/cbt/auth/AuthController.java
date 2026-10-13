package com.example.cbt.auth;

import com.example.cbt.auth.dto.LoginReq;
import com.example.cbt.auth.dto.LoginRes;
import com.example.cbt.auth.dto.RefreshTokenReq;
import com.example.cbt.auth.dto.SignupReq;
import com.example.cbt.common.ApiResponse;
import com.example.cbt.user.User;
import com.example.cbt.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;
  private final UserService userService;
  private final org.springframework.beans.factory.ObjectProvider<
          org.springframework.security.oauth2.client.registration.ClientRegistrationRepository>
      registrations;

  @org.springframework.web.bind.annotation.GetMapping("/providers")
  public ApiResponse<java.util.List<String>> providers() {
    var repo = registrations.getIfAvailable();
    return ApiResponse.ok(
        java.util.stream.Stream.of("google", "kakao", "naver")
            .filter(id -> repo != null && repo.findByRegistrationId(id) != null)
            .toList());
  }

  @PostMapping("/signup")
  public ApiResponse<User> signup(@jakarta.validation.Valid @RequestBody SignupReq req) {
    return ApiResponse.ok(
        userService.register(req.email(), req.username(), req.password(), req.role()));
  }

  @PostMapping("/login")
  public ResponseEntity<ApiResponse<LoginRes>> login(
      @jakarta.validation.Valid @RequestBody LoginReq req) {
    return ResponseEntity.ok(ApiResponse.ok(authService.login(req.username(), req.password())));
  }

  public record OAuthCode(@jakarta.validation.constraints.NotBlank String code) {}

  @PostMapping("/oauth/exchange")
  public ApiResponse<LoginRes> exchange(@jakarta.validation.Valid @RequestBody OAuthCode req) {
    return ApiResponse.ok(authService.exchangeOAuthCode(req.code()));
  }

  @PostMapping("/refresh")
  public ApiResponse<LoginRes> refresh(@jakarta.validation.Valid @RequestBody RefreshTokenReq req) {
    return ApiResponse.ok(authService.refreshToken(req.refreshToken()));
  }

  @PostMapping("/logout")
  public ApiResponse<String> logout(@jakarta.validation.Valid @RequestBody RefreshTokenReq req) {
    authService.logoutToken(req.refreshToken());
    return ApiResponse.ok("로그아웃 되었습니다.");
  }
}
