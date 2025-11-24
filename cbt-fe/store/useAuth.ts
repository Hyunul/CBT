"use client";

import { create } from "zustand";

interface AuthStore {
  token: string | null;
  userId: number | null;
  role: string | null;
  login: (token: string, userId: number, role: string) => void;
  logout: () => void;
  isLoaded: boolean; // 초기 로딩 완료 체크
}

export const useAuth = create<AuthStore>((set) => ({
  token: null,
  userId: null,
  role: null,
  isLoaded: false,

  // 로그인 처리
  login: (token, userId, role) => {
    // 로컬스토리지 저장
    localStorage.setItem("token", token);
    localStorage.setItem("userId", String(userId));
    localStorage.setItem("role", role);

    set({
      token,
      userId,
      role,
      isLoaded: true,
    });
  },

  // 로그아웃 처리
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");

    set({
      token: null,
      userId: null,
      role: null,
      isLoaded: true,
    });

    // 로그아웃 후 메인 페이지 이동
    window.location.href = "/";
  },
}));

// 초기화: 새로고침 후 로그인 유지
if (typeof window !== "undefined") {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");

  if (token) {
    useAuth.setState({
      token,
      userId: userId ? Number(userId) : null,
      role,
      isLoaded: true,
    });
  } else {
    useAuth.setState({ isLoaded: true });
  }
}
