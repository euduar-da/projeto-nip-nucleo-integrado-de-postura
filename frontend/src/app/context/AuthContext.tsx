import { createContext, useContext, useState, ReactNode } from "react";

type AuthUser = {
  token: string;
  tipo: "colaborador" | "paciente";
  nome: string;
  email: string;
  perfil?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  login: (userData: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("nip_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData: AuthUser) => {
    localStorage.setItem("nip_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("nip_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);