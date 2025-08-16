import { useEffect, useState } from "react";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const syncData = async (data) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch("http://localhost:5000/api/user/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Sync failed:", error);
    }
  };

  const loadUserData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const response = await fetch("http://localhost:5000/api/user/data", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error("Load data failed:", error);
    }
    return null;
  };

  return {
    user,
    loading,
    login,
    logout,
    syncData,
    loadUserData,
  };
};
