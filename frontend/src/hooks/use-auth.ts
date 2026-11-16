"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import type { LoginInput } from "@/types/auth";
import { clearCsrfToken } from "@/lib/csrf";
import axios from "axios";

export const AUTH_QUERY_KEY = ["auth", "current-user"];

export function useCurrentUser() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: authService.getCurrentUser,

    retry: (failureCount, error) => {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 401 || status === 403) {
          return false;
        }

        if (status && status >= 400 && status < 500) {
          return false;
        }
      }

      return failureCount < 1;
    },

    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),

    onSuccess: (user) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,

    onSuccess: () => {
      
      queryClient.clear();

      
      clearCsrfToken();
    },
  });
}