"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";
import type { AuthResponse, Role, User } from "./types";

type AuthState = {
  user: User | null;
  token: string | null;
  ready: boolean;
  setSession: (session: AuthResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);
const TOKEN_KEY = "testpoint_token";
const USER_KEY = "testpoint_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (!storedToken || !storedUser) {
      queueMicrotask(() => setReady(true));
      return;
    }
    const cached = JSON.parse(storedUser) as User;
    queueMicrotask(() => {
      setToken(storedToken);
      setUser(cached);
    });
    api<User>("/api/auth/me", {}, storedToken)
      .then((fresh) => {
        setUser(fresh);
        localStorage.setItem(USER_KEY, JSON.stringify(fresh));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  function setSession(session: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    setToken(session.token);
    setUser(session.user);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, token, ready, setSession, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is missing");
  return value;
}

export function homeFor(role: Role) {
  if (role === "ADMIN") return "/admin";
  if (role === "INSTRUCTOR") return "/instructor";
  return "/student";
}
