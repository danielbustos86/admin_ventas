import { createContext, useContext, useState, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface AuthCtx {
  isAuthed: boolean;
  login: (key: string) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState<boolean>(() => !!localStorage.getItem('apiKey'));

  const login = (key: string) => {
    localStorage.setItem('apiKey', key);
    setIsAuthed(true);
  };
  const logout = () => {
    localStorage.removeItem('apiKey');
    setIsAuthed(false);
  };

  return <Ctx.Provider value={{ isAuthed, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth fuera de AuthProvider');
  return ctx;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthed } = useAuth();
  const location = useLocation();
  if (!isAuthed) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}
