"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/store/useAuth";

type Props = {
  children: React.ReactNode;
};

export default function AdminLayout({ children }: Props) {
  const { token, role, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    // 인증 안 됨: 로그인 페이지로 이동
    if (!token) {
      toast.error("로그인이 필요합니다.");
      router.replace("/login");
      return;
    }

    // 권한 없음: 홈으로 이동
    if (role !== "ROLE_ADMIN") {
      toast.error("관리자만 접근할 수 있습니다.");
      router.replace("/");
    }
  }, [token, role, isLoaded, router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        인증 정보를 불러오는 중입니다...
      </div>
    );
  }

  // 토큰이 없거나 권한이 없으면 빈 화면을 잠시 보여줌 (useEffect에서 리다이렉트)
  if (!token || role !== "ROLE_ADMIN") {
    return <div />;
  }

  return <>{children}</>;
}
