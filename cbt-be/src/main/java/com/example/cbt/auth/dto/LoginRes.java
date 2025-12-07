package com.example.cbt.auth.dto;

public record LoginRes(String accessToken, Long userId, String username, String role) {}
