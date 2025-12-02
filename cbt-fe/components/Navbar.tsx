"use client";
import { useAuth } from "@/store/useAuth";
import Link from "next/link";

export default function Navbar() {
  const { token, logout, role } = useAuth();

  return (
    <nav className="bg-white shadow px-6 py-3 flex justify-between items-center">
      <Link href="/" className="font-bold text-lg text-blue-600">
        CBT Platform
      </Link>

      <div className="flex items-center gap-4">
        <Link href="/ranking" className="text-gray-700 hover:text-blue-600">
          랭킹
        </Link>

        {token ? (
          <>
            {role === "ADMIN" && (
              <>
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
            <Link href="/login" className="text-gray-700 hover:text-blue-600">
              로그인
            </Link>
            <Link href="/signup" className="text-gray-700 hover:text-blue-600">
              회원가입
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
