import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";


const api = axios.create({
  baseURL: API_BASE_URL,

  headers: {
    "Content-Type": "application/json",
  },
});


// ============================================================
// TOKEN REFRESH STATE
// ============================================================

let refreshPromise = null;

let feedbackRefreshPromise = null;


// ============================================================
// NORMAL AUTH CLEAR
// ============================================================

const clearAuthentication = () => {

  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");

  window.dispatchEvent(
    new Event("smartnotify:auth-expired")
  );
};


// ============================================================
// FEEDBACK AUTH CLEAR
// ============================================================

const clearFeedbackAuthentication = () => {

  localStorage.removeItem(
    "feedback_access_token"
  );

  localStorage.removeItem(
    "feedback_refresh_token"
  );

  localStorage.removeItem(
    "feedback_user"
  );

  window.dispatchEvent(
    new Event("smartnotify:feedback-auth-expired")
  );
};


// ============================================================
// CHECK FEEDBACK AUTH ENDPOINT
// ============================================================

const isFeedbackAuthRequest = (url = "") => {

  return (
    url.includes(
      "/users/feedback-login"
    ) ||
    url.includes(
      "/users/feedback-register"
    )
  );
};


// ============================================================
// CHECK FEEDBACK API ENDPOINT
// ============================================================

const isFeedbackRequest = (url = "") => {

  // Recipient-facing feedback response endpoints use
  // the dedicated feedback token.
  //
  // Workspace feedback, analytics, and translation
  // endpoints use the normal SmartNotify access token.

  return url.includes(
    "/feedback/response/"
  );
};


// ============================================================
// NORMAL TOKEN REFRESH
// ============================================================

const refreshAccessToken = async () => {

  const refreshToken =
    localStorage.getItem(
      "refresh_token"
    );

  if (!refreshToken) {

    throw new Error(
      "No refresh token available."
    );
  }


  if (!refreshPromise) {

    refreshPromise = axios.post(

      `${API_BASE_URL}/users/refresh`,

      {
        refresh_token:
          refreshToken,
      },

      {
        headers: {
          "Content-Type":
            "application/json",
        },
      }

    )
      .then((response) => {

        const newAccessToken =
          response.data?.access_token;

        if (!newAccessToken) {

          throw new Error(
            "Refresh response did not contain an access token."
          );
        }


        localStorage.setItem(
          "token",
          newAccessToken
        );


        return newAccessToken;

      })

      .catch((error) => {

        clearAuthentication();

        throw error;

      })

      .finally(() => {

        refreshPromise = null;

      });

  }


  return refreshPromise;
};


// ============================================================
// FEEDBACK TOKEN REFRESH
// ============================================================

const refreshFeedbackAccessToken =
  async () => {

    const refreshToken =
      localStorage.getItem(
        "feedback_refresh_token"
      );

    if (!refreshToken) {

      throw new Error(
        "No feedback refresh token available."
      );
    }


    if (!feedbackRefreshPromise) {

      feedbackRefreshPromise =
        axios.post(

          `${API_BASE_URL}/users/refresh`,

          {
            refresh_token:
              refreshToken,
          },

          {
            headers: {
              "Content-Type":
                "application/json",
            },
          }

        )
          .then((response) => {

            const newAccessToken =
              response.data?.access_token;

            if (!newAccessToken) {

              throw new Error(
                "Feedback refresh response did not contain an access token."
              );
            }


            localStorage.setItem(
              "feedback_access_token",
              newAccessToken
            );


            return newAccessToken;

          })

          .catch((error) => {

            clearFeedbackAuthentication();

            throw error;

          })

          .finally(() => {

            feedbackRefreshPromise =
              null;

          });

    }


    return feedbackRefreshPromise;
  };


// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

api.interceptors.request.use(

  (config) => {

    const url =
      config.url || "";


    const feedbackAuth =
      isFeedbackAuthRequest(url);

    const feedbackRequest =
      isFeedbackRequest(url);
      


    config.headers =
      config.headers || {};


    // ========================================================
    // FEEDBACK AUTHENTICATION
    //
    // /users/feedback-login
    // /users/feedback-register
    //
    // These MUST NOT receive the normal workspace token.
    // ========================================================

    if (feedbackAuth) {

      delete config.headers.Authorization;

      console.log(
        "API REQUEST:",
        config.method?.toUpperCase(),
        config.url,
        "TOKEN:",
        "NO"
      );

      return config;
    }


    // ========================================================
    // FEEDBACK API
    //
    // /feedback/...
    //
    // Use feedback-specific token.
    // ========================================================

    if (feedbackRequest) {

      const feedbackToken =
        localStorage.getItem(
          "feedback_access_token"
        );


      if (
        feedbackToken &&
        !config.skipAuth
      ) {

        config.headers.Authorization =
          `Bearer ${feedbackToken}`;

      } else {

        delete config.headers.Authorization;

      }


      console.log(
        "API REQUEST:",
        config.method?.toUpperCase(),
        config.url,
        "FEEDBACK TOKEN:",
        feedbackToken
          ? "YES"
          : "NO"
      );


      return config;
    }


    // ========================================================
    // NORMAL SMARTNOTIFY API
    //
    // Everything else uses normal workspace token.
    // ========================================================

    const token =
      localStorage.getItem(
        "token"
      );


    if (
      token &&
      !config.skipAuth
    ) {

      config.headers.Authorization =
        `Bearer ${token}`;

    } else {

      delete config.headers.Authorization;

    }


    console.log(
      "API REQUEST:",
      config.method?.toUpperCase(),
      config.url,
      "TOKEN:",
      token
        ? "YES"
        : "NO"
    );


    return config;

  },

  (error) => {

    return Promise.reject(error);

  }
);


// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

api.interceptors.response.use(

  (response) => {

    return response;

  },


  async (error) => {

    const originalRequest =
      error.config;


    if (!originalRequest) {

      return Promise.reject(
        error
      );
    }


    const url =
      originalRequest.url || "";


    const feedbackAuth =
      isFeedbackAuthRequest(url);


    const feedbackRequest =
      isFeedbackRequest(url) &&
      !originalRequest.workspaceAuth;


    // ========================================================
    // NEVER REFRESH AUTH DURING FEEDBACK LOGIN/REGISTER
    // ========================================================

    if (feedbackAuth) {

      return Promise.reject(
        error
      );
    }


    // ========================================================
    // FEEDBACK API → FEEDBACK TOKEN REFRESH
    // ========================================================

    if (
      feedbackRequest &&
      error.response?.status === 401 &&
      !originalRequest._feedbackRetry &&
      localStorage.getItem(
        "feedback_refresh_token"
      )
    ) {

      originalRequest._feedbackRetry =
        true;


      try {

        const newAccessToken =
          await refreshFeedbackAccessToken();


        originalRequest.headers =
          originalRequest.headers ||
          {};


        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;


        return api(
          originalRequest
        );

      } catch (refreshError) {

        clearFeedbackAuthentication();

        return Promise.reject(
          refreshError
        );
      }
    }


    // ========================================================
    // NORMAL API → NORMAL TOKEN REFRESH
    // ========================================================

    if (
      !feedbackRequest &&
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes(
        "/users/refresh"
      ) &&
      localStorage.getItem(
        "refresh_token"
      )
    ) {

      originalRequest._retry =
        true;


      try {

        const newAccessToken =
          await refreshAccessToken();


        originalRequest.headers =
          originalRequest.headers ||
          {};


        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;


        return api(
          originalRequest
        );

      } catch (refreshError) {

        clearAuthentication();

        return Promise.reject(
          refreshError
        );
      }
    }


    return Promise.reject(
      error
    );
  }
);


export default api;