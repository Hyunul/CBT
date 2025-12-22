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

  if (res.status === 401) {
      if (typeof window !== "undefined") {
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
              try {
                  // Try to refresh the token
                  // Also handle potential double /api for refresh endpoint
                  let refreshPath = "/api/auth/refresh";
                  if (API_BASE.endsWith("/api")) {
                      refreshPath = "/auth/refresh";
                  }

                  const refreshRes = await fetch(`${API_BASE}${refreshPath}`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ refreshToken }),
                  });

                  if (refreshRes.ok) {
                      const data = await refreshRes.json();
                      if (data.success && data.data) {
                          const { accessToken, refreshToken: newRefreshToken } = data.data;
                          
                          // Update tokens in localStorage
                          localStorage.setItem("token", accessToken);
                          if (newRefreshToken) {
                              localStorage.setItem("refreshToken", newRefreshToken);
                          }

                          // Retry the original request with the new token
                          const newHeaders = {
                              ...headers,
                              Authorization: `Bearer ${accessToken}`,
                          };
                          
                          const retryRes = await fetch(`${API_BASE}${cleanPath}`, {
                              ...init,
                              headers: newHeaders,
                          });
                          
                          // Return the result of the retried request
                          if (retryRes.ok) {
                              return retryRes.json();
                          }
                          // If retried request fails, continue to error handling below
                      }
                  }
              } catch (refreshError) {
                  // If refresh fails, fall through to logout
                  console.error("Token refresh failed", refreshError);
              }
          }

          // If we are here, either no refresh token, or refresh failed.
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
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