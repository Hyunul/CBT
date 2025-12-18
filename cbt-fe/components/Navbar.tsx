"use client";
import { useAuth } from "@/store/useAuth";
import { BookMarked, LogOut } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
    const { token, logout, role, username } = useAuth();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                    <BookMarked className="h-6 w-6 text-primary" />
                    <span className="font-bold sm:inline-block">
                        CBT Platform
                    </span>
                </Link>
                <nav className="flex items-center gap-6 text-sm font-medium">
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
                <div className="flex flex-1 items-center justify-end gap-4">
                    {token ? (
                        <>
                            <span className="text-sm font-medium text-foreground/80 hidden sm:inline-block">
                                {username}님
                            </span>
                            <button
                                onClick={logout}
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
