package com.example.cbt.auth;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cbt.auth.dto.LoginReq;
import com.example.cbt.auth.dto.LoginRes;
import com.example.cbt.auth.dto.SignupReq;
import com.example.cbt.common.ApiResponse;
import com.example.cbt.user.User;
import com.example.cbt.user.UserRole;
import com.example.cbt.user.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/signup")
    public ApiResponse<User> signup(@RequestBody SignupReq req) {
        return ApiResponse.ok(userService.register(req.email(), req.password(), UserRole.valueOf(req.role())));
    }

    @PostMapping("/login")
    public ApiResponse<LoginRes> login(@RequestBody LoginReq req) {
        return ApiResponse.ok(authService.login(req.email(), req.password()));
    }
}
