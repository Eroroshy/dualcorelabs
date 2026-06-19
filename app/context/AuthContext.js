import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useEffect, useState } from "react";

import { API_URL } from "../config/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {

    try {

      const storedToken =
        await AsyncStorage.getItem("token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_URL}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        }
      );

      if (!response.ok) {
        await AsyncStorage.removeItem("token");
        setLoading(false);
        return;
      }

      const userData =
        await response.json();

      setToken(storedToken);
      setUser(userData);

    } catch (error) {

      console.log(
        "Error loading session:",
        error
      );

    } finally {

      setLoading(false);

    }

  };

  const login = async (
    userData,
    jwtToken
  ) => {

    await AsyncStorage.setItem(
      "token",
      jwtToken
    );

    setUser(userData);
    setToken(jwtToken);

  };

  const logout = async () => {

    await AsyncStorage.removeItem(
      "token"
    );

    setUser(null);
    setToken(null);

  };

  const updateUser = async (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};