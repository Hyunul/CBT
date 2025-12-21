package com.example.cbt.auth;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cbt.auth.dto.LoginReq;
import com.example.cbt.auth.dto.LoginRes;
import com.example.cbt.auth.dto.RefreshTokenReq;
import com.example.cbt.auth.dto.SignupReq;
import com.example.cbt.common.ApiResponse;
import com.example.cbt.user.User;
import com.example.cbt.user.UserService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;

// ... imports

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/signup")
    public ApiResponse<User> signup(@RequestBody SignupReq req) {
        return ApiResponse.ok(userService.register(req.email(), req.username(), req.password(), req.role()));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginRes>> login(@RequestBody LoginReq req) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(authService.login(req.username(), req.password())));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/refresh")
    public ApiResponse<LoginRes> refresh(@RequestBody RefreshTokenReq req) {
        return ApiResponse.ok(authService.refreshToken(req.refreshToken()));
    }
}
