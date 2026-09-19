import api from "./api";

import {
  signInWithGoogle,
  signOutFromFirebase,
} from "../firebase";


const authService = {


  // ============================================================
  // MAIN LOGIN
  // ============================================================

  login: async (
    email,
    password,
    role
  ) => {

    const response = await api.post(
      "/users/login",
      {
        email,
        password,
        role,
      }
    );

    return response.data;
  },


  // ============================================================
  // MAIN REGISTRATION
  // ============================================================

  register: async (
    name,
    email,
    password,
    role
  ) => {

    const response = await api.post(
      "/users/register",
      {
        name,
        email,
        password,
        role,
      }
    );

    return response.data;
  },


  // ============================================================
  // FEEDBACK LOGIN
  // ============================================================

  feedbackLogin: async (
    email,
    password
  ) => {

    const response = await api.post(
      "/users/feedback-login",
      {
        email,
        password,
        role: "User",
      },
      {
        skipAuth: true,
      }
    );

    return response.data;
  },


  // ============================================================
  // FEEDBACK REGISTRATION
  // ============================================================

  feedbackRegister: async (
    name,
    email,
    password
  ) => {

    const response = await api.post(
      "/users/feedback-register",
      {
        name,
        email,
        password,
        role: "User",
      },
      {
        skipAuth: true,
      }
    );

    return response.data;
  },


  // ============================================================
  // FEEDBACK GOOGLE LOGIN
  // ============================================================

  feedbackGoogleLogin: async (
    mode = "signin"
  ) => {

    const {
      idToken,
    } = await signInWithGoogle();

    const response = await api.post(
      "/users/google-login",
      {
        id_token: idToken,
        role: "User",
        mode,
      },
      {
        skipAuth: true,
      }
    );

    return response.data;
  },


  // ============================================================
  // MAIN GOOGLE LOGIN
  // ============================================================

  googleLogin: async (
    role,
    mode = "signin"
  ) => {

    const {
      idToken,
    } = await signInWithGoogle();

    const response = await api.post(
      "/users/google-login",
      {
        id_token: idToken,
        role,
        mode,
      }
    );

    return response.data;
  },


  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  forgotPassword: async (
    email
  ) => {

    const response = await api.post(
      "/users/forgot-password",
      {
        email,
      },
      {
        skipAuth: true,
      }
    );

    return response.data;
  },


  // ============================================================
  // RESET PASSWORD
  // ============================================================

  resetPassword: async (
    token,
    newPassword,
    confirmPassword
  ) => {

    const response = await api.post(
      "/users/reset-password",
      {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      },
      {
        skipAuth: true,
      }
    );

    return response.data;
  },


  // ============================================================
  // REFRESH TOKEN
  // ============================================================

  refreshAccessToken: async () => {

    const refreshToken =
      localStorage.getItem(
        "refresh_token"
      );

    if (!refreshToken) {

      throw new Error(
        "No refresh token available."
      );
    }

    const response = await api.post(
      "/users/refresh",
      {
        refresh_token: refreshToken,
      },
      {
        skipAuth: true,
      }
    );

    return response.data;
  },


  // ============================================================
  // LOGOUT
  // ============================================================

  logout: () => {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "refresh_token"
    );

    localStorage.removeItem(
      "user"
    );

    localStorage.removeItem(
      "feedback_access_token"
    );

    localStorage.removeItem(
      "feedback_refresh_token"
    );

    localStorage.removeItem(
      "feedback_user"
    );

    signOutFromFirebase()
      .catch(
        (error) => {
          console.warn(
            "Firebase logout failed:",
            error
          );
        }
      );
  },


  // ============================================================
  // PROFILE
  // ============================================================

  getProfile: async () => {

    const token =
      localStorage.getItem(
        "token"
      );

    const response = await api.get(
      "/users/me",
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    return response.data;
  },

};


export default authService;