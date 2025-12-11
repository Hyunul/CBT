"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import Input from "@/components/Input";

import Input from "@/components/Input";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState({
    email: "",
    username: "",
    password: "",
    general: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    // Reset errors
    setFormErrors({ email: "", username: "", password: "", general: "" });

    // 비밀번호 길이 검증 (예시)
    if (password.length < 4) {
      setFormErrors((prev) => ({
        ...prev,
        password: "비밀번호는 4자 이상이어야 합니다.",
      }));
      return;
    }
    setLoading(true);

    try {
      await api("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, username, password, role: "ROLE_USER" }),
      });
      toast.success("회원가입이 완료되었습니다. 잠시 후 로그인 페이지로 이동합니다.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (err: any) {
      setFormErrors((prev) => ({
        ...prev,
        general: "회원가입에 실패했습니다. 다른 아이디/이메일을 사용해주세요.",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container relative flex h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <UserPlus className="mx-auto h-8 w-8" />
          <h1 className="text-2xl font-semibold tracking-tight">
            회원가입
          </h1>
          <p className="text-sm text-muted-foreground">
            CBT 플랫폼을 이용하기 위해 계정을 생성하세요.
          </p>
        </div>
        <div className="grid gap-6">
          <form onSubmit={handleSignup}>
            <div className="grid gap-4">
              <Input
                id="email"
                label="이메일"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                error={formErrors.email}
              />
              <Input
                id="username"
                label="아이디"
                placeholder="사용할 아이디"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
                error={formErrors.username}
              />
              <Input
                id="password"
                label="비밀번호"
                type="password"
                placeholder="비밀번호 (4자 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                error={formErrors.password}
              />
              {formErrors.general && (
                <p className="text-sm font-medium text-destructive">
                  {formErrors.general}
                </p>
              )}
              <button className="btn-primary w-full" disabled={loading}>
                {loading ? "가입 중..." : "동의하고 가입"}
              </button>
            </div>
          </form>
        </div>
        <p className="px-8 text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="underline underline-offset-4 hover:text-primary"
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}