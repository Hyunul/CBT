"use client";

import { create } from "zustand";

interface AuthStore {
    token: string | null;
    refreshToken: string | null; // Added
    userId: number | null;
    username: string | null;
    role: string | null;
    login: (token: string, refreshToken: string, userId: number, username: string, role: string) => void; // Updated signature
    logout: () => void;
    isLoaded: boolean; 
}

export const useAuth = create<AuthStore>((set) => ({
    token: null,
    refreshToken: null, // Added
    userId: null,
    username: null,
    role: null,
    isLoaded: false,

    // 로그인 처리
    login: (token, refreshToken, userId, username, role) => {
        // 로컬스토리지 저장
        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken); // Added
        localStorage.setItem("userId", String(userId));
        localStorage.setItem("username", username);
        localStorage.setItem("role", role);

        set({
            token,
            refreshToken, // Added
            userId,
            username,
            role,
            isLoaded: true,
        });
    },

    // 로그아웃 처리
    logout: async () => {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                // Handle potentially missing /api in URL or double slashes, but keep it simple for now as per project convention
                await fetch(`${API_BASE}/api/auth/logout`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error("Logout API call failed:", error);
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken"); // Added
            localStorage.removeItem("userId");
            localStorage.removeItem("username");
            localStorage.removeItem("role");

            set({
                token: null,
                refreshToken: null, // Added
                userId: null,
                username: null,
                role: null,
                isLoaded: true,
            });

            // 로그아웃 후 메인 페이지 이동
            window.location.href = "/";
        }
    },
}));

// 초기화: 새로고침 후 로그인 유지
if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refreshToken"); // Added
    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (token && userId) {
        useAuth.setState({
            token,
            refreshToken: refreshToken || null, // Added
            userId: Number(userId),
            username: username || "",
            role: role || "",
            isLoaded: true,
        });
    } else {
        useAuth.setState({ isLoaded: true });
    }
}
