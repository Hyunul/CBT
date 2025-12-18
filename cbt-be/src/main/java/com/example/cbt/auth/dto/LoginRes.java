package com.example.cbt.auth.dto;

public record LoginRes(String accessToken, String refreshToken, Long userId, String username, String role) {}
