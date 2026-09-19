import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import authService from "../services/authService";

export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("token")
  );

  const [loading, setLoading] = useState(false);


  // ============================================================
  // LOGIN
  // ============================================================

  const login = async (email, password, role) => {
    setLoading(true);

    try {
      const data = await authService.login(
        email,
        password,
        role
      );

      console.log("LOGIN RESPONSE:", data);

      if (!data?.access_token) {
        console.error("No access_token returned from backend.");
        return false;
      }

      // Save JWT
      localStorage.setItem(
        "token",
        data.access_token
      );

      if (data.refresh_token) {
        localStorage.setItem(
          "refresh_token",
          data.refresh_token
        );
      }

      // Update React state
      setToken(data.access_token);

      // Save user
      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        setCurrentUser(data.user);
      }


      return true;

    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error.response?.data || error.message
      );

      throw error;

    } finally {
      setLoading(false);
    }
  };


  // ============================================================
  // CREATE ACCOUNT
  // ============================================================

  const register = async (name, email, password, role) => {
    setLoading(true);

    try {
      const data = await authService.register(
        name,
        email,
        password,
        role
      );

      if (!data?.access_token) {
        return false;
      }

      localStorage.setItem("token", data.access_token);

      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }

      setToken(data.access_token);

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setCurrentUser(data.user);
      }

      return true;
    } catch (error) {
      console.error(
        "REGISTRATION ERROR:",
        error.response?.data || error.message
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };


  // ============================================================
  // GOOGLE LOGIN / SIGN-UP
  // ============================================================

  const googleLogin = async (role, mode = "signin") => {
    setLoading(true);

    try {
      const data = await authService.googleLogin(
        role,
        mode
      );

      if (!data?.access_token) {
        console.error(
          "No access_token returned from Google authentication."
        );
        return false;
      }

      localStorage.setItem(
        "token",
        data.access_token
      );

      if (data.refresh_token) {
        localStorage.setItem(
          "refresh_token",
          data.refresh_token
        );
      }

      setToken(data.access_token);

      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        setCurrentUser(data.user);
      }

      return true;

    } catch (error) {
      console.error(
        "GOOGLE LOGIN ERROR:",
        error.response?.data || error.message
      );

      throw error;

    } finally {
      setLoading(false);
    }
  };


  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = () => {
    // Clear the SmartNotify JWT/user state immediately so protected routes
    // close at once, and also sign the user out of Firebase/Google.
    authService.logout();

    setToken(null);
    setCurrentUser(null);
  };


  // ============================================================
  // AUTHENTICATION EXPIRY EVENT
  // ============================================================

  useEffect(() => {
    const handleAuthExpired = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");

      setToken(null);
      setCurrentUser(null);
    };

    window.addEventListener(
      "smartnotify:auth-expired",
      handleAuthExpired
    );

    return () => {
      window.removeEventListener(
        "smartnotify:auth-expired",
        handleAuthExpired
      );
    };
  }, []);


  // ============================================================
  // LOAD USER WHEN TOKEN EXISTS
  // ============================================================

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        return;
      }

      try {
        const user = await authService.getProfile();

        setCurrentUser(user);

        localStorage.setItem(
          "user",
          JSON.stringify(user)
        );

      } catch (error) {
        console.error(
          "Could not load user:",
          error.response?.data || error.message
        );

        // Invalid/expired token
        if (error.response?.status === 401) {
          // The Axios interceptor already attempted token refresh.
          // If refresh also failed, it dispatched smartnotify:auth-expired.
          return;
        }

        console.error("Profile request failed without authentication error.");
      }
    };

    loadUser();
  }, [token]);


  // ============================================================
  // CONTEXT
  // ============================================================

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        loading,
        login,
        register,
        googleLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}