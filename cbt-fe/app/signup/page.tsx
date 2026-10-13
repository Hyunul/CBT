"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { currentReturnPath, loginHref } from "@/lib/login-return";
import { UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import Input from "@/components/Input";

export default function SignupPage() {
  const router = useRouter();
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
  const emailRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const generalErrorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (loading) return;
    if (formErrors.email) emailRef.current?.focus();
    else if (formErrors.username) usernameRef.current?.focus();
    else if (formErrors.password) passwordRef.current?.focus();
    else if (formErrors.general) generalErrorRef.current?.focus();
  }, [formErrors, loading]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    // Reset errors
    setFormErrors({ email: "", username: "", password: "", general: "" });

    // 비밀번호 길이 검증 (예시)
    if (password.length < 8) {
      setFormErrors((prev) => ({
        ...prev,
        password: "비밀번호는 8자 이상이어야 합니다.",
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
        router.push(loginHref(currentReturnPath()));
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        if (err.message.includes("이메일")) {
          setFormErrors((prev) => ({ ...prev, email: "이미 사용 중인 이메일입니다. 다른 이메일을 입력해주세요." }));
        } else if (err.message.includes("아이디")) {
          setFormErrors((prev) => ({ ...prev, username: "이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요." }));
        } else {
          setFormErrors((prev) => ({ ...prev, general: "이미 사용 중인 아이디 또는 이메일입니다. 입력 내용을 확인해주세요." }));
        }
      } else {
        setFormErrors((prev) => ({
          ...prev,
          general: err instanceof ApiError
            ? err.status === 400
              ? "입력 형식이 올바르지 않습니다. 이메일, 아이디, 비밀번호를 확인해주세요."
              : "서버에서 회원가입을 처리하지 못했습니다. 잠시 후 다시 시도해주세요."
            : "서버에 연결하지 못했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.",
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container relative flex min-h-[calc(100dvh-var(--navbar-height))] flex-col items-center justify-center py-10">
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
                ref={emailRef}
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
                ref={usernameRef}
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
                ref={passwordRef}
                label="비밀번호"
                type="password"
                placeholder="비밀번호 (8자 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                error={formErrors.password}
              />
              {formErrors.general && (
                <p ref={generalErrorRef} tabIndex={-1} role="alert" className="text-sm font-medium text-destructive">
                  {formErrors.general}
                </p>
              )}
              <button className="btn-primary w-full" disabled={loading}>
                {loading ? "가입 중..." : "회원가입"}
              </button>
            </div>
          </form>
        </div>
        <p className="px-8 text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            onClick={(event) => { event.preventDefault(); router.push(loginHref(currentReturnPath())); }}
            className="underline underline-offset-4 hover:text-primary"
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
