package com.example.cbt.auth.dto;

import jakarta.validation.constraints.*;

public record SignupReq(
    @NotBlank @Email @Size(max = 254) String email,
    @NotBlank @Pattern(regexp = "[A-Za-z0-9_]{3,40}") String username,
    @NotBlank @Size(min = 8, max = 72) String password,
    String role) {}
