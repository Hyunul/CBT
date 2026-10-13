"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/useAuth";
import { api, LoginData } from "@/lib/api";
import toast from "react-hot-toast";
import { clearOAuthReturn, loginHref, readOAuthReturn } from "@/lib/login-return";
export default function CallbackPage() {
  const router = useRouter();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const code = new URLSearchParams(window.location.hash.slice(1)).get("code");
    window.history.replaceState(null, "", window.location.pathname);
    if (!code) {
      router.replace(loginHref(readOAuthReturn()));
      return;
    }
    api<{ data: LoginData }>("/api/auth/oauth/exchange", {
      method: "POST",
      body: JSON.stringify({ code }),
    })
      .then(({ data }) => {
        useAuth
          .getState()
          .login(
            data.accessToken,
            data.refreshToken,
            data.userId,
            data.username,
            data.role,
          );
        const returnPath = readOAuthReturn();
        clearOAuthReturn();
        router.replace(returnPath);
      })
      .catch(() => {
        toast.error("로그인을 완료하지 못했습니다. 다시 시도해주세요.");
        router.replace(loginHref(readOAuthReturn()));
      });
  }, [router]);
  return <div className="p-12 text-center">로그인 처리 중...</div>;
}
