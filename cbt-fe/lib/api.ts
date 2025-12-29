import { useAuth } from "@/store/useAuth";

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

  // Prevent double /api if API_BASE ends with /api and path starts with /api
  let cleanPath = path;
  if (API_BASE.endsWith("/api") && path.startsWith("/api/")) {
      cleanPath = path.substring(4);
  } else if (API_BASE.endsWith("/") && path.startsWith("/api/")) {
      // Prevent double slashes e.g. https://domain.com//api/...
       cleanPath = path.substring(1);
  }

  const res = await fetch(`${API_BASE}${cleanPath}`, {
    ...init,
    headers,
  });

  // 401 Unauthorized handling (Token Expiration)
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      const refreshToken = localStorage.getItem("refreshToken");
      
      // Only attempt refresh if we have a refresh token and this wasn't already a refresh attempt
      if (refreshToken && !path.includes("/auth/refresh")) {
        try {
          // Construct refresh URL correctly
          let refreshPath = "/api/auth/refresh";
          if (API_BASE.endsWith("/api")) {
            refreshPath = "/auth/refresh";
          } else if (API_BASE.endsWith("/")) {
             refreshPath = "api/auth/refresh";
          }

          const refreshRes = await fetch(`${API_BASE}${refreshPath}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            
            // Check response structure (ApiResponse<LoginRes>)
            if (data.success && data.data) {
              const { accessToken, refreshToken: newRefreshToken, id, username, role } = data.data;

              // 1. Update LocalStorage
              localStorage.setItem("token", accessToken);
              if (newRefreshToken) {
                localStorage.setItem("refreshToken", newRefreshToken);
              }
              
              // 2. Update Zustand Store
              useAuth.getState().login(
                accessToken,
                newRefreshToken || refreshToken,
                id,
                username,
                role
              );
              
              // 3. Retry the original request with new token
              const newHeaders = {
                ...headers,
                Authorization: `Bearer ${accessToken}`,
              };

              const retryRes = await fetch(`${API_BASE}${cleanPath}`, {
                ...init,
                headers: newHeaders,
              });

              // Return the retry result directly
              if (retryRes.ok) {
                 return retryRes.json();
              }
              
              // If retry fails (e.g. 403 or 404), throw error based on retryRes
              // Fall through to error handling below logic
               const retryErrorJson = await retryRes.json().catch(() => ({}));
               throw new Error(retryErrorJson.message || "Retried request failed");
            }
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
        }
      }

      // If refresh failed or no refresh token, logout
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      window.location.href = "/login";
      // Return null or throw to stop execution
      throw new Error("Session expired. Please login again.");
    }
  }

  if (!res.ok) {
    
    let errorMessage = "Request failed";
    try {
        const errorJson = await res.json();
        if (errorJson && errorJson.message) {
            errorMessage = errorJson.message;
        }
    } catch (e) {
        const text = await res.text();
        if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }
  
  const contentLength = res.headers.get("Content-Length");
  if (contentLength && parseInt(contentLength) === 0) {
      return null as T;
  }

  return res.json();
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

export async function getSeriesList(): Promise<ExamSeries[]> {
  const res = await api<{ success: boolean; data: ExamSeries[] }>("/api/series");
  return res.data;
}

export async function createSeries(name: string, description: string): Promise<ExamSeries> {
  const res = await api<{ success: boolean; data: ExamSeries }>("/api/series", {
      method: "POST",
      body: JSON.stringify({ name, description }),
  });
  return res.data;
}

export async function updateSeries(id: number, name: string, description: string): Promise<ExamSeries> {
  const res = await api<{ success: boolean; data: ExamSeries }>(`/api/series/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, description }),
  });
  return res.data;
}

export async function deleteSeries(id: number, force: boolean = false): Promise<void> {
  await api(`/api/series/${id}?force=${force}`, {
      method: "DELETE",
  });
}