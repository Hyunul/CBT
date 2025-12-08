"use client";
import { api } from "@/lib/api";
import { useAuth } from "@/store/useAuth";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/Input";

// =========================================================
// MOCK 구현을 제거하고, 원래의 Next.js 및 프로젝트 모듈을 사용합니다.
// =========================================================

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await api<{
                data: {
                    accessToken: string;
                    userId: number;
                    username: string;
                    role: string;
                };
            }>("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const {
                accessToken,
                userId,
                username: resUsername,
                role,
            } = res.data;
            login(accessToken, userId, resUsername, role);

            // Next.js 라우터를 사용하여 페이지 이동
            router.push("/");
        } catch (err: any) {
            console.error("Login API Error:", err);
            setError(
                // 원래의 사용자 친화적인 에러 메시지
                "로그인에 실패했습니다. 아이디 또는 비밀번호를 확인해주세요."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container relative flex h-screen flex-col items-center justify-center">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <div className="flex flex-col space-y-2 text-center">
                    <LogIn className="mx-auto h-8 w-8 text-indigo-600" />
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        로그인
                    </h1>
                    {/* 프로젝트에서 사용하는 Tailwind 클래스 (text-muted-foreground) */}
                    <p className="text-sm text-muted-foreground">
                        계정에 로그인하여 시험을 시작하세요.
                    </p>
                </div>
                <div className="grid gap-6">
                    <form onSubmit={handleLogin}>
                        <div className="grid gap-4">
                            <Input
                                id="username"
                                label="아이디"
                                placeholder="아이디를 입력하세요"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={loading}
                                required
                            />
                            <Input
                                id="password"
                                label="비밀번호"
                                type="password"
                                placeholder="비밀번호를 입력하세요"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                required
                                error={error}
                            />
                            <button
                                className="btn-primary w-full"
                                disabled={loading || !username || !password}
                            >
                                {loading ? "로그인 중..." : "로그인"}
                            </button>
                        </div>
                    </form>
                </div>
                {/* Next.js Link 컴포넌트 사용 */}
                <p className="px-8 text-center text-sm text-muted-foreground">
                    아직 계정이 없으신가요?{" "}
                    <Link
                        href="/signup"
                        className="underline underline-offset-4 hover:text-primary"
                    >
                        회원가입
                    </Link>
                </p>
            </div>
        </div>
    );
}
