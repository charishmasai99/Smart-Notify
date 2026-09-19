import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000",

  headers: {
    "Content-Type": "application/json",
  },
});

// =====================================================
// ATTACH JWT TO EVERY REQUEST
// =====================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    console.log(
      "API REQUEST:",
      config.method?.toUpperCase(),
      config.url,
      "TOKEN:",
      token ? "YES" : "NO"
    );

    // The refresh endpoint is intentionally sent without the
    // expired access token. All normal requests still receive the
    // current access token exactly as before.
    if (token && !config.skipAuth) {
      config.headers = config.headers || {};
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =====================================================
// RESPONSE HANDLER + ACCESS-TOKEN REFRESH
// =====================================================
//
// A 401 from a protected endpoint can simply mean that the short-lived
// access token has expired. The existing backend already exposes
// POST /users/refresh and the login flow already stores refresh_token.
// Refresh once, retry the original request, and leave all API contracts
// and backend authorization unchanged.
// =====================================================

api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    console.error(
      "API ERROR:",
      originalRequest?.url,
      status,
      error.response?.data
    );

    const refreshToken = localStorage.getItem("refresh_token");
    const isRefreshRequest =
      originalRequest?.url?.includes("/users/refresh");

    // Retry a protected request only once. Do not attempt to refresh
    // login failures, the refresh endpoint itself, or requests that
    // explicitly opted out of authentication.
    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isRefreshRequest ||
      originalRequest.skipAuth ||
      !refreshToken
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const baseURL = String(
        import.meta.env.VITE_API_BASE_URL ||
          "http://127.0.0.1:8000"
      ).replace(/\/$/, "");

      const refreshResponse = await axios.post(
        `${baseURL}/users/refresh`,
        {
          refresh_token: refreshToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const newAccessToken =
        refreshResponse.data?.access_token;

      if (!newAccessToken) {
        throw new Error(
          "Refresh succeeded without an access token."
        );
      }

      localStorage.setItem(
        "token",
        newAccessToken
      );

      originalRequest.headers =
        originalRequest.headers || {};
      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      console.log(
        "JWT REFRESH SUCCESS: retrying",
        originalRequest.method?.toUpperCase(),
        originalRequest.url
      );

      return api(originalRequest);
    } catch (refreshError) {
      console.error(
        "JWT REFRESH FAILED:",
        refreshError.response?.data ||
          refreshError.message
      );

      // Do not silently destroy the user's session here. The caller
      // receives the original 401 and can present its existing error
      // state. This preserves the current logout/session behavior.
      return Promise.reject(error);
    }
  }
);

export default api;
