"use client";
import { useState } from "react";
import { api } from "@/lib/api";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CANDIDATE");
  const [message, setMessage] = useState("");

  const handleSignup = async () => {
    try {
      await api("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, username, password, role }),
      });
      setMessage("회원가입 완료! 로그인 해주세요.");
    } catch (err: any) {
      setMessage("실패: " + err.message);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-4 text-center">회원가입</h1>
        <input
          className="input mb-2"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input mb-2"
          placeholder="아이디"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="input mb-2"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <select
          className="input mb-4"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="CANDIDATE">응시자</option>
          <option value="ADMIN">관리자</option>
        </select>
        <button className="btn-primary w-full" onClick={handleSignup}>
          회원가입
        </button>
        {message && <p className="text-sm text-center mt-3">{message}</p>}
      </div>
    </main>
  );
}
