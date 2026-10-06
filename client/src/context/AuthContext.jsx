import React, { useState, useEffect, useCallback } from "react";
import {
  getMeApi,
  loginApi,
  registerApi,
  logoutApi,
  updateMeApi,
  updatePasswordApi,
} from "../features/auth/api";
import { AuthContext } from "./authContextInstance";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getMeApi();
      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    function handleExpired() {
      setUser(null);
    }

    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, [refreshUser]);

  const login = async (credentials) => {
    const loggedUser = await loginApi(credentials);
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (payload) => {
    const newUser = await registerApi(payload);
    setUser(newUser);
    return newUser;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (payload) => {
    const updated = await updateMeApi(payload);
    setUser(updated);
    return updated;
  };

  const changePassword = async (payload) => {
    return await updatePasswordApi(payload);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
