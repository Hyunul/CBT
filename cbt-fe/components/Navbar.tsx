"use client";
import { useAuth } from "@/store/useAuth";
import Link from "next/link";

export default function Navbar() {
  const { token, logout, role } = useAuth();

  return (
    <nav className="bg-white shadow px-6 py-3 flex justify-between items-center">
      <a href="/" className="font-bold text-lg text-blue-600">
        CBT Platform
      </a>
      <div className="flex items-center gap-4">
        {token ? (
          <>
            {role === "ADMIN" && (
              <>
                <a
                  href="/admin/grading"
                  className="text-gray-700 hover:text-blue-600"
                >
                  채점
                </a>
                <Link href="/admin/exams" className="hover:text-blue-400">
                  시험 관리
                </Link>
              </>
            )}
            <button
              className="text-sm text-gray-600 hover:text-red-500"
              onClick={logout}
            >
              로그아웃
            </button>
          </>
        ) : (
          <>
            <a href="/login" className="text-gray-700 hover:text-blue-600">
              로그인
            </a>
            <a href="/signup" className="text-gray-700 hover:text-blue-600">
              회원가입
            </a>
          </>
        )}
      </div>
    </nav>
  );
}
