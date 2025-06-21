import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<Response, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest({
        url: "/api/login",
        method: "POST",
        body: credentials
      });
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "로그인 성공(Login successful)",
        description: `환영합니다, ${user.username}님!(Welcome, ${user.username}!)`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "로그인 실패(Login failed)",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest({
        url: "/api/register",
        method: "POST",
        body: credentials
      });
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "회원가입 성공(Registration successful)",
        description: `환영합니다, ${user.username}님!(Welcome, ${user.username}!)`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "회원가입 실패(Registration failed)",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await apiRequest("POST", "/api/logout");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "로그아웃 실패");
        }
        return response;
      } catch (error) {
        console.error("Logout error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // 모든 캐시 데이터 초기화
      queryClient.clear();
      queryClient.setQueryData(["/api/user"], null);
      
      // 홈페이지로 강제 이동
      window.location.href = "/";
      
      toast({
        title: "로그아웃 되었습니다(Logged out)",
        description: "성공적으로 로그아웃 되었습니다.(You have been successfully logged out.)",
      });
    },
    onError: (error: Error) => {
      // 오류가 발생해도 클라이언트 측에서 로그아웃 처리
      queryClient.clear();
      queryClient.setQueryData(["/api/user"], null);
      window.location.href = "/";
      
      toast({
        title: "로그아웃 처리됨(Logout processed)",
        description: "로그아웃이 처리되었습니다.(Logout has been processed.)",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}