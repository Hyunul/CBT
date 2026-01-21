"use client";
import { api } from "@/lib/api";
import { useAuth } from "@/store/useAuth";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/Input";
import toast from "react-hot-toast";

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
                    refreshToken: string;
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
                refreshToken,
                userId,
                username: resUsername,
                role,
            } = res.data;
            login(accessToken, refreshToken, userId, resUsername, role);

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

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-500">
                                SNS 로그인
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {/* Google Login */}
                        <a
                            href="http://localhost:8080/oauth2/authorization/google"
                            className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            <span>Google로 계속하기</span>
                        </a>

                        {/* Kakao Login */}
                        <a
                            href="http://localhost:8080/oauth2/authorization/kakao"
                            className="flex w-full items-center justify-center gap-3 rounded-md bg-[#FEE500] px-4 py-2.5 text-sm font-medium text-[#191919] shadow-sm transition-all hover:bg-[#FADA0A] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.712 4.8 4.346 6.148l-.874 3.104c-.066.235.067.477.294.54.077.021.156.023.23.004l3.647-2.43c.441.048.892.073 1.357.073 4.97 0 9-3.185 9-7.115S16.97 3 12 3z" />
                            </svg>
                            <span>카카오 로그인</span>
                        </a>

                        {/* Naver Login */}
                        <a
                            href="http://localhost:8080/oauth2/authorization/naver"
                            className="flex w-full items-center justify-center gap-3 rounded-md bg-[#03C75A] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#02b350] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            <span className="text-lg font-bold">N</span>
                            <span>네이버 로그인</span>
                        </a>
                    </div>
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
