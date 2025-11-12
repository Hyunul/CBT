"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      const res = await api<{
        data: { accessToken: string; userId: number; role: string };
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      login(res.data.accessToken, res.data.userId, res.data.role);
      window.location.href = "/";
    } catch (err: any) {
      setError("로그인 실패: " + err.message);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-4 text-center">로그인</h1>
        <input
          className="input mb-2"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="input mb-4"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <button className="btn-primary w-full" onClick={handleLogin}>
          로그인
        </button>
        <p className="text-sm text-gray-600 mt-3 text-center">
          아직 계정이 없나요?{" "}
          <a href="/signup" className="text-blue-600 hover:underline">
            회원가입
          </a>
        </p>
      </div>
    </main>
  );
}
