"use client";
import { useAuth } from "@/store/useAuth";
import { BookMarked, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { loginHref } from "@/lib/login-return";

export default function Navbar() {
  const router = useRouter();
  const { token, logout, role, username } = useAuth();
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const updateHeight = () => {
      document.documentElement.style.setProperty("--navbar-height", `${header.getBoundingClientRect().height}px`);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  const signOut = async () => {
    try {
      await logout();
    } catch {
      toast.error(
        "기기에서 로그아웃했습니다. 서버 연결 실패로 세션 해제를 확인하지 못했습니다.",
      );
    }
    router.replace("/");
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      <div className="container flex min-h-14 flex-wrap gap-y-2 py-2 max-w-screen-2xl items-center">
        <Link
          href="/"
          className="mr-3 flex shrink-0 items-center space-x-2 whitespace-nowrap md:mr-6"
        >
          <BookMarked className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">CBT Platform</span>
        </Link>
        <nav className="order-3 flex w-full items-center flex-wrap gap-3 whitespace-nowrap text-sm font-medium md:order-none md:w-auto">
          <Link
            href="/ranking"
            className="text-foreground/60 transition-colors hover:text-foreground/80"
          >
            랭킹
          </Link>
          {token && (
            <>
              <Link
                href="/my-history"
                className="text-foreground/60 transition-colors hover:text-foreground/80"
              >
                나의 응시 이력
              </Link>
              {role === "ROLE_ADMIN" && (
                <>
                  <Link
                    href="/admin/exams"
                    className="text-foreground/60 transition-colors hover:text-foreground/80"
                  >
                    시험 관리
                  </Link>
                  <Link
                    href="/admin/series"
                    className="text-foreground/60 transition-colors hover:text-foreground/80"
                  >
                    시리즈 관리
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
        <div className="ml-auto flex shrink-0 items-center justify-end gap-3 whitespace-nowrap md:pl-4">
          {token ? (
            <>
              <span className="text-sm font-medium text-foreground/80 hidden sm:inline-block">
                {username}님
              </span>
              <button
                onClick={signOut}
                className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={(event) => {
                  event.preventDefault();
                  router.push(loginHref(window.location.pathname + window.location.search + window.location.hash));
                }}
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
