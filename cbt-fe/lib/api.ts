export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Interface for common Spring Pageable response
export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    const text = await res.text();
    throw new Error(text || "Request failed");
  }
  const contentLength = res.headers.get("Content-Length");
  const contentType = res.headers.get("Content-Type");

  if (
    (contentLength && parseInt(contentLength) === 0) ||
    (contentType && !contentType.includes("application/json"))
  ) {
    return [] as T;
  }

  try {
    return res.json();
  } catch (e) {
    console.warn(
      "API response was not valid JSON, returning empty array/object.",
      e
    );
    return [] as T;
  }
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface Exam {
  id: number;
  title: string;
  questionCount: number;
  durationSec: number;
  totalScore: number;
  isPublished: boolean;
  author: User; // Changed from createdBy: number
  createdAt: string;
  updatedAt: string;
  attemptCount: number;
  round?: number;
  series?: {
    id: number;
    name: string;
  };
}

export interface ExamSeries {
  id: number;
  name: string;
  description: string;
}

export interface ExamListRes {
  popularExams: Exam[];
  otherExams: Exam[];
}

export async function getExamList(): Promise<ExamListRes> {
  const res = await api<{ success: boolean; data: ExamListRes }>("/api/exams/list");
  return res.data;
}