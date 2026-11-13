"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import axios from "axios";
import { useCurrentUser } from "@/hooks/use-auth";
import type { AuthUser } from "@/types/auth";

type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: unknown;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const {
    data: user,
    isPending,
    isError,
    error,
  } = useCurrentUser();

  let status: AuthStatus = "loading";

  if (isPending) {
    status = "loading";
  } else if (user) {
    status = "authenticated";
  } else if (isError) {
    const statusCode = axios.isAxiosError(error)
      ? error.response?.status
      : undefined;

    status = statusCode === 401 ? "unauthenticated" : "error";
  } else {
    status = "unauthenticated";
  }

  const value: AuthContextValue = {
    user: user ?? null,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    error: error ?? null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}