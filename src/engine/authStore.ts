"use client";

import { create } from "zustand";
import { apiFetch } from "@/lib/apiClient";

type User = { id: string; email?: string } | null;

type AuthState = {
  user: User;
  csrfToken: string | null;
  loading: boolean;
  error: string | null;

  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  csrfToken: null,
  loading: false,
  error: null,

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch<{ user: User; csrfToken: string | null }>("/me");
      set({ user: data.user, csrfToken: data.csrfToken, loading: false });
    } catch (e) {
      set({ user: null, csrfToken: null, loading: false, error: e instanceof Error ? e.message : "Auth error" });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await apiFetch("/auth/login", { method: "POST", body: { email, password } });
      await get().refresh();
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : "Login failed" });
      throw e;
    }
  },

  register: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await apiFetch("/auth/register", { method: "POST", body: { email, password } });
      await get().refresh();
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : "Register failed" });
      throw e;
    }
  },

  logout: async () => {
    const csrfToken = get().csrfToken;
    set({ loading: true, error: null });
    try {
      await apiFetch("/auth/logout", { method: "POST", csrfToken });
      await get().refresh();
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : "Logout failed" });
      throw e;
    }
  },
}));

