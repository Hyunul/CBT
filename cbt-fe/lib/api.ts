import { useAuth } from "@/store/useAuth";
import { apiUrl } from "@/lib/api-url";
export { API_BASE } from "@/lib/api-url";

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}
export interface LoginData {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
  role: string;
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
let refreshing: Promise<void> | null = null;
async function read<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (res.ok)
        throw new ApiError("서버 응답 형식이 올바르지 않습니다.", res.status);
    }
  }
  if (!res.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : "요청을 처리하지 못했습니다.";
    throw new ApiError(message, res.status);
  }
  return data as T;
}
async function refresh(): Promise<void> {
  const token = localStorage.getItem("refreshToken");
  if (!token) throw new ApiError("로그인이 필요합니다.", 401);
  const res = await fetch(apiUrl("/api/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: token }),
  });
  const { data } = await read<{ data: LoginData }>(res);
  useAuth
    .getState()
    .login(
      data.accessToken,
      data.refreshToken,
      data.userId,
      data.username,
      data.role,
    );
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const browser = typeof window !== "undefined";
  const authEndpoint = path.startsWith("/api/auth/");
  const send = () => {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has("Content-Type"))
      headers.set("Content-Type", "application/json");
    const token =
      browser && !authEndpoint ? localStorage.getItem("token") : null;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const attempt = path.match(/^\/api\/attempts\/(\d+)(?:\/|$)/);
    const guestKey =
      browser && attempt
        ? localStorage.getItem(`attempt-key:${attempt[1]}`)
        : null;
    if (guestKey) headers.set("X-Attempt-Key", guestKey);
    return fetch(apiUrl(path), { ...init, headers });
  };
  let res = await send();
  if (res.status === 401 && browser && !authEndpoint) {
    try {
      if (!refreshing)
        refreshing = refresh().finally(() => {
          refreshing = null;
        });
      await refreshing;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        useAuth.getState().clear();
      }
      throw error;
    }
    res = await send();
  }
  const data = await read<T>(res);
  const guestKey = res.headers.get("X-Attempt-Key");
  if (browser && guestKey && typeof data === "number")
    localStorage.setItem(`attempt-key:${data}`, guestKey);
  return data;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export type ExamType = "WRITTEN" | "PRACTICAL";

export interface Exam {
  id: number;
  title: string;
  type?: ExamType;
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
  const res = await api<{ success: boolean; data: ExamListRes }>(
    "/api/exams/list",
  );
  return res.data;
}

export async function getSeriesList(): Promise<ExamSeries[]> {
  const res = await api<{ success: boolean; data: ExamSeries[] }>(
    "/api/series",
  );
  return res.data;
}

export async function createSeries(
  name: string,
  description: string,
): Promise<ExamSeries> {
  const res = await api<{ success: boolean; data: ExamSeries }>("/api/series", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
  return res.data;
}

export async function updateSeries(
  id: number,
  name: string,
  description: string,
): Promise<ExamSeries> {
  const res = await api<{ success: boolean; data: ExamSeries }>(
    `/api/series/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({ name, description }),
    },
  );
  return res.data;
}

export async function deleteSeries(
  id: number,
  force: boolean = false,
): Promise<void> {
  await api(`/api/series/${id}?force=${force}`, {
    method: "DELETE",
  });
}
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "요청에 실패했습니다.";
}
export interface EditableQuestion {
  text: string;
  type: string;
  choices?: string;
  answerKey?: string;
  answerKeywords?: string;
  score: number;
  tags: string;
  explanation: string;
}
