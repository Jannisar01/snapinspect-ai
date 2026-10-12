
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  projectKey: string | null;
  login: (user: User) => void;
  logout: () => void;
  verifyProject: (key: string) => boolean;
  clearProject: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [projectKey, setProjectKey] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('snap_user');
    const savedKey = sessionStorage.getItem('snap_project_key');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        sessionStorage.removeItem('snap_user');
      }
    }
    if (savedKey) setProjectKey(savedKey);
    setIsInitialized(true);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    sessionStorage.setItem('snap_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setProjectKey(null);
    sessionStorage.removeItem('snap_user');
    sessionStorage.removeItem('snap_project_key');
  };

  const verifyProject = (key: string) => {
    const validKeys = ['111111', '222222', '333333'];
    if (validKeys.includes(key)) {
      setProjectKey(key);
      sessionStorage.setItem('snap_project_key', key);
      return true;
    }
    return false;
  };

  const clearProject = () => {
    setProjectKey(null);
    sessionStorage.removeItem('snap_project_key');
  };

  if (!isInitialized) return null; // Prevent flicker/stale redirect

  return (
    <AuthContext.Provider value={{ user, projectKey, login, logout, verifyProject, clearProject }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
