"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/store/useAuth";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    useEffect(() => {
        const accessToken = searchParams.get("accessToken");
        const refreshToken = searchParams.get("refreshToken");

        if (accessToken && refreshToken) {
            try {
                const decoded: any = jwtDecode(accessToken);
                // decoded: { sub: "userId", username: "...", role: "...", iat: ..., exp: ... }
                
                const userId = Number(decoded.sub);
                const username = decoded.username;
                const role = decoded.role;

                login(accessToken, refreshToken, userId, username, role);
                
                toast.success("로그인 성공!");
                router.push("/");
            } catch (e) {
                console.error("Token decode failed", e);
                toast.error("로그인 처리 중 오류가 발생했습니다.");
                router.push("/login");
            }
        } else {
             // If no token, maybe wait a bit or redirect (could be slow loading?)
             // But if we are here, we expect tokens.
             // If manual navigation without params, go back to login.
             const timeout = setTimeout(() => {
                 if (!accessToken) router.push("/login");
             }, 1000);
             return () => clearTimeout(timeout);
        }
    }, [searchParams, router, login]);

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">로그인 처리 중...</h2>
                <p className="text-muted-foreground">잠시만 기다려주세요.</p>
            </div>
        </div>
    );
}

export default function CallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CallbackContent />
        </Suspense>
    );
}
