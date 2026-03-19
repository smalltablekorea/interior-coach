"use client";

import { createContext, useContext } from "react";

interface AuthContextType {
  user: { id: string; name: string; email: string; image?: string | null } | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: () => {},
});

// TODO: DB 연결 후 실제 세션 기반으로 변경
const DEMO_USER = {
  id: "demo",
  name: "인테리어코치",
  email: "demo@interiorcoach.kr",
  image: null,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider
      value={{
        user: DEMO_USER,
        loading: false,
        signOut: () => {
          window.location.href = "/auth/login";
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
