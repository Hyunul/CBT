import { create } from "zustand";

interface AuthState {
  token: string | null;
  userId: number | null;
  role: string | null;
  login: (token: string, userId: number, role: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  userId: null,
  role: null,
  login: (token, userId, role) => {
    localStorage.setItem("token", token);
    set({ token, userId, role });
  },
  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, userId: null, role: null });
  },
}));
