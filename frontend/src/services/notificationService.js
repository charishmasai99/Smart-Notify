import { getToken } from "firebase/messaging";

import {
  getFirebaseMessaging,
  firebaseVapidKey,
} from "../firebase";

import api from "./api";


// ============================================================
// FIREBASE FCM PUSH NOTIFICATIONS
// ============================================================

// Prevent duplicate FCM registration attempts when React
// StrictMode runs effects more than once during development.

let pushRegistrationPromise = null;


// ============================================================
// PUBLIC FCM REGISTRATION FUNCTION
// ============================================================

export const registerForPushNotifications = async () => {

  // ----------------------------------------------------------
  // If registration is already running, reuse the same promise.
  // ----------------------------------------------------------

  if (
    pushRegistrationPromise
  ) {

    return pushRegistrationPromise;

  }


  pushRegistrationPromise =
    registerPushInternal();


  try {

    return await pushRegistrationPromise;

  } finally {

    pushRegistrationPromise =
      null;

  }

};


// ============================================================
// INTERNAL FCM REGISTRATION
// ============================================================

const registerPushInternal = async () => {

  try {

    // ----------------------------------------------------------
    // Browser Notification API support
    // ----------------------------------------------------------

    if (
      !("Notification" in window)
    ) {

      console.warn(
        "Browser notifications are not supported."
      );

      return null;

    }


    // ----------------------------------------------------------
    // Service Worker support
    // ----------------------------------------------------------

    if (
      !("serviceWorker" in navigator)
    ) {

      console.warn(
        "Service workers are not supported."
      );

      return null;

    }


    // ----------------------------------------------------------
    // Push API support
    // ----------------------------------------------------------

    if (
      !("PushManager" in window)
    ) {

      console.warn(
        "Push notifications are not supported by this browser."
      );

      return null;

    }


    // ----------------------------------------------------------
    // Check secure context.
    //
    // localhost and 127.0.0.1 are allowed during development.
    // ----------------------------------------------------------

    if (
      !window.isSecureContext &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {

      console.warn(
        "Push notifications require a secure context."
      );

      return null;

    }


    // ==========================================================
    // NOTIFICATION PERMISSION
    // ==========================================================

    let permission =
      Notification.permission;


    if (
      permission === "default"
    ) {

      permission =
        await Notification.requestPermission();

    }


    if (
      permission !== "granted"
    ) {

      console.warn(
        "Notification permission was not granted."
      );

      return null;

    }


    // ==========================================================
    // FIREBASE MESSAGING
    // ==========================================================

    const messaging =
      await getFirebaseMessaging();


    if (!messaging) {

      console.warn(
        "Firebase Messaging is not available."
      );

      return null;

    }


    // ==========================================================
    // FIREBASE SERVICE WORKER
    // ==========================================================

    let registration;


    try {

      registration =
        await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          {
            scope: "/",
          }
        );

    } catch (error) {

      console.error(
        "Firebase service worker registration failed:",
        error
      );

      return null;

    }


    // ----------------------------------------------------------
    // Wait for service worker
    // ----------------------------------------------------------

    try {

      registration =
        await navigator.serviceWorker.ready;

    } catch (error) {

      console.error(
        "Firebase service worker is not ready:",
        error
      );

      return null;

    }


    // ==========================================================
    // VAPID KEY
    // ==========================================================

    if (
      !firebaseVapidKey
    ) {

      console.error(
        "Firebase VAPID key is missing."
      );

      return null;

    }


    // ==========================================================
    // GET FCM TOKEN
    // ==========================================================

    let token = null;


    try {

      token =
        await getToken(
          messaging,
          {
            vapidKey:
              firebaseVapidKey,

            serviceWorkerRegistration:
              registration,
          }
        );

    } catch (error) {

      // --------------------------------------------------------
      // IMPORTANT:
      //
      // Some Chrome profiles/environments do not have a usable
      // push service. This produces:
      //
      // AbortError:
      // Registration failed - push service not available
      //
      // This should NOT break SmartNotify.
      // --------------------------------------------------------

      if (
        error?.name === "AbortError"
      ) {

        console.warn(
          "⚠️ Push service is unavailable in this browser/profile."
        );

        console.warn(
          "SmartNotify Web Broadcast will continue normally."
        );

        return null;

      }


      console.error(
        "FCM token generation failed:",
        error
      );

      return null;

    }


    // ==========================================================
    // TOKEN CHECK
    // ==========================================================

    console.log(
      "FCM TOKEN:",
      token
    );


    if (!token) {

      console.warn(
        "Could not generate FCM token."
      );

      return null;

    }


    // ==========================================================
    // REGISTER TOKEN WITH BACKEND
    // ==========================================================

    try {

      await api.post(
        "/notifications/register-token",
        {
          token: token,
        }
      );

    } catch (error) {

      console.error(
        "Failed to register FCM token with SmartNotify:",
        error
      );

      return null;

    }


    console.log(
      "✅ FCM token registered with SmartNotify."
    );


    return token;


  } catch (error) {

    console.error(
      "Push notification registration failed:",
      error
    );

    return null;

  }

};


// ============================================================
// SMARTNOTIFY WEB BROADCAST WEBSOCKET
// ============================================================
//
// One shared WebSocket connection is used by all components.
//
// Example consumers:
//
//     Dashboard
//     Channels
//     Notifications
//
// Each component calls:
//
//     connectWebBroadcast(callback)
//
// and later:
//
//     disconnectWebBroadcast(callback)
//
// The actual WebSocket is closed only when the consumer count
// reaches zero.
//
// ============================================================


// ============================================================
// GLOBAL WEBSOCKET STATE
// ============================================================

let webSocket = null;

let webSocketGeneration = 0;

let webSocketReconnectTimer = null;

let webSocketHeartbeatTimer = null;

let webSocketIntentionalClose = false;

let webSocketConnecting = false;

let webSocketUsers = 0;

const webSocketCallbacks = new Set();


// ============================================================
// WEBSOCKET URL
// ============================================================

const getWebSocketUrl = () => {

  // ----------------------------------------------------------
  // Vite environment variable.
  //
  // Example:
  //
  // VITE_WS_URL=ws://127.0.0.1:8000
  //
  // ----------------------------------------------------------

  const configuredUrl =
    import.meta.env.VITE_WS_URL;


  if (configuredUrl) {

    return configuredUrl.replace(
      /\/$/,
      ""
    );

  }


  // ----------------------------------------------------------
  // Local development fallback.
  // ----------------------------------------------------------

  return "ws://127.0.0.1:8000";

};


// ============================================================
// START HEARTBEAT
// ============================================================

const startHeartbeat = () => {

  stopHeartbeat();


  webSocketHeartbeatTimer =
    setInterval(
      () => {

        if (
          webSocket &&
          webSocket.readyState ===
            WebSocket.OPEN
        ) {

          try {

            webSocket.send(
              "ping"
            );

          } catch (error) {

            console.warn(
              "⚠️ SmartNotify WebSocket heartbeat failed:",
              error
            );

          }

        }

      },
      25000
    );

};


// ============================================================
// STOP HEARTBEAT
// ============================================================

const stopHeartbeat = () => {

  if (
    webSocketHeartbeatTimer
  ) {

    clearInterval(
      webSocketHeartbeatTimer
    );

    webSocketHeartbeatTimer =
      null;

  }

};


// ============================================================
// CLEAR RECONNECT TIMER
// ============================================================

const clearReconnectTimer = () => {

  if (
    webSocketReconnectTimer
  ) {

    clearTimeout(
      webSocketReconnectTimer
    );

    webSocketReconnectTimer =
      null;

  }

};


// ============================================================
// HANDLE WEBSOCKET MESSAGE
// ============================================================

const handleWebBroadcastMessage = (
  event
) => {

  console.log(
    "📢 Web Broadcast received:",
    event.data
  );


  let data =
    event.data;


  // ----------------------------------------------------------
  // Try to parse JSON.
  // ----------------------------------------------------------

  try {

    data =
      JSON.parse(
        event.data
      );

  } catch {

    // Keep raw string.

  }


  // ----------------------------------------------------------
  // GLOBAL FRONTEND EVENT
  // ----------------------------------------------------------

  window.dispatchEvent(
    new CustomEvent(
      "smartnotify-web-broadcast",
      {
        detail: data,
      }
    )
  );


  // ----------------------------------------------------------
  // CALLBACKS
  // ----------------------------------------------------------

  webSocketCallbacks.forEach(
    (callback) => {

      try {

        callback(
          data
        );

      } catch (error) {

        console.error(
          "❌ SmartNotify Web Broadcast callback error:",
          error
        );

      }

    }
  );

};


// ============================================================
// SCHEDULE RECONNECT
// ============================================================

const scheduleReconnect = () => {

  // ----------------------------------------------------------
  // Don't reconnect after intentional shutdown.
  // ----------------------------------------------------------

  if (
    webSocketIntentionalClose
  ) {

    return;

  }


  // ----------------------------------------------------------
  // Nobody is using WebSocket.
  // ----------------------------------------------------------

  if (
    webSocketUsers <= 0
  ) {

    return;

  }


  // ----------------------------------------------------------
  // Reconnect already scheduled.
  // ----------------------------------------------------------

  if (
    webSocketReconnectTimer
  ) {

    return;

  }


  console.log(
    "🔄 Reconnecting SmartNotify Web Broadcast in 3 seconds..."
  );


  webSocketReconnectTimer =
    setTimeout(
      () => {

        webSocketReconnectTimer =
          null;


        if (
          webSocketUsers <= 0
        ) {

          return;

        }


        connectSocket();

      },
      3000
    );

};


// ============================================================
// CREATE WEBSOCKET
// ============================================================

const connectSocket = () => {

  // ----------------------------------------------------------
  // Existing OPEN connection.
  // ----------------------------------------------------------

  if (
    webSocket &&
    webSocket.readyState ===
      WebSocket.OPEN
  ) {

    return webSocket;

  }


  // ----------------------------------------------------------
  // Existing CONNECTING connection.
  // ----------------------------------------------------------

  if (
    webSocket &&
    webSocket.readyState ===
      WebSocket.CONNECTING
  ) {

    return webSocket;

  }


  // ----------------------------------------------------------
  // Nobody needs WebSocket.
  // ----------------------------------------------------------

  if (
    webSocketUsers <= 0
  ) {

    return null;

  }


  // ----------------------------------------------------------
  // Another connection attempt is already running.
  // ----------------------------------------------------------

  if (
    webSocketConnecting
  ) {

    return webSocket;

  }


  // ----------------------------------------------------------
  // Start connection.
  // ----------------------------------------------------------

  webSocketConnecting =
    true;


  webSocketIntentionalClose =
    false;


  clearReconnectTimer();


  const wsBaseUrl =
    getWebSocketUrl();


  const wsUrl =
    `${wsBaseUrl}/channels/websocket`;


  console.log(
    "🔌 Connecting SmartNotify Web Broadcast:",
    wsUrl
  );


  let socket;


  try {

    socket =
      new WebSocket(
        wsUrl
      );

  } catch (error) {

    webSocketConnecting =
      false;


    console.error(
      "❌ Could not create SmartNotify WebSocket:",
      error
    );


    scheduleReconnect();


    return null;

  }


  // ----------------------------------------------------------
  // Store socket globally.
  // ----------------------------------------------------------

  webSocket =
    socket;


  // ----------------------------------------------------------
  // Unique generation for this socket.
  //
  // This prevents old/stale sockets created by React StrictMode
  // from interfering with the current connection.
  // ----------------------------------------------------------

  const generation =
    ++webSocketGeneration;


  // ==========================================================
  // OPEN
  // ==========================================================

  socket.onopen = () => {

    // --------------------------------------------------------
    // Ignore an old/stale socket.
    // --------------------------------------------------------

    if (
      generation !==
      webSocketGeneration
    ) {

      return;

    }


    webSocketConnecting =
      false;


    console.log(
      "✅ SmartNotify Web Broadcast connected"
    );


    console.log(
      "Active WebSocket consumers:",
      webSocketUsers
    );


    clearReconnectTimer();


    startHeartbeat();

  };


  // ==========================================================
  // MESSAGE
  // ==========================================================

  socket.onmessage = (
    event
  ) => {

    // --------------------------------------------------------
    // Ignore stale socket.
    // --------------------------------------------------------

    if (
      generation !==
      webSocketGeneration
    ) {

      return;

    }


    handleWebBroadcastMessage(
      event
    );

  };


  // ==========================================================
  // ERROR
  // ==========================================================

  socket.onerror = (
    error
  ) => {

    // --------------------------------------------------------
    // Ignore stale socket.
    // --------------------------------------------------------

    if (
      generation !==
      webSocketGeneration
    ) {

      return;

    }


    console.warn(
      "⚠️ SmartNotify Web Broadcast WebSocket error:",
      error
    );

  };


  // ==========================================================
  // CLOSE
  // ==========================================================

  socket.onclose = (
    event
  ) => {

    // --------------------------------------------------------
    // Ignore old socket events.
    // --------------------------------------------------------

    if (
      generation !==
      webSocketGeneration
    ) {

      return;

    }


    webSocketConnecting =
      false;


    stopHeartbeat();


    console.warn(
      "⚠️ SmartNotify Web Broadcast disconnected",
      {
        code:
          event.code,

        reason:
          event.reason,

        wasClean:
          event.wasClean,

        consumers:
          webSocketUsers,
      }
    );


    // --------------------------------------------------------
    // Only clear current socket.
    // --------------------------------------------------------

    if (
      webSocket === socket
    ) {

      webSocket =
        null;

    }


    // --------------------------------------------------------
    // Intentional close.
    // --------------------------------------------------------

    if (
      webSocketIntentionalClose
    ) {

      return;

    }


    // --------------------------------------------------------
    // Nobody needs the connection.
    // --------------------------------------------------------

    if (
      webSocketUsers <= 0
    ) {

      return;

    }


    // --------------------------------------------------------
    // Unexpected disconnect.
    // --------------------------------------------------------

    scheduleReconnect();

  };


  return socket;

};


// ============================================================
// CONNECT WEB BROADCAST
// ============================================================
//
// Usage:
//
// const handleBroadcast = (message) => {
//     console.log(message);
// };
//
// useEffect(() => {
//
//     connectWebBroadcast(handleBroadcast);
//
//     return () => {
//
//         disconnectWebBroadcast(handleBroadcast);
//
//     };
//
// }, []);
//
// ============================================================

export const connectWebBroadcast = (
  onMessage = null
) => {

  // ----------------------------------------------------------
  // Register callback.
  // ----------------------------------------------------------

  if (
    typeof onMessage ===
    "function"
  ) {

    webSocketCallbacks.add(
      onMessage
    );

  }


  // ----------------------------------------------------------
  // Increase consumer count.
  // ----------------------------------------------------------

  webSocketUsers += 1;


  console.log(
    "📡 SmartNotify Web Broadcast consumer connected:",
    webSocketUsers
  );


  // ----------------------------------------------------------
  // Connection is wanted again.
  // ----------------------------------------------------------

  webSocketIntentionalClose =
    false;


  // ----------------------------------------------------------
  // Create/reuse connection.
  // ----------------------------------------------------------

  return connectSocket();

};


// ============================================================
// DISCONNECT WEB BROADCAST
// ============================================================
//
// IMPORTANT:
//
// The current socket generation is invalidated BEFORE closing
// the socket.
//
// This prevents the old CONNECTING socket from being treated as
// an unexpected connection failure.
//
// This fixes:
//
// "WebSocket is closed before the connection is established."
//
// ============================================================

export const disconnectWebBroadcast = (
  onMessage = null
) => {

  // ----------------------------------------------------------
  // Remove callback.
  // ----------------------------------------------------------

  if (
    typeof onMessage ===
    "function"
  ) {

    webSocketCallbacks.delete(
      onMessage
    );

  }


  // ----------------------------------------------------------
  // Decrease consumer count.
  // ----------------------------------------------------------

  if (
    webSocketUsers > 0
  ) {

    webSocketUsers -= 1;

  }


  console.log(
    "📡 SmartNotify Web Broadcast consumer disconnected:",
    webSocketUsers
  );


  // ----------------------------------------------------------
  // Another component still uses WebSocket.
  // ----------------------------------------------------------

  if (
    webSocketUsers > 0
  ) {

    return;

  }


  // ==========================================================
  // NO CONSUMERS LEFT
  // ==========================================================

  webSocketIntentionalClose =
    true;


  clearReconnectTimer();


  stopHeartbeat();


  // ----------------------------------------------------------
  // IMPORTANT:
  //
  // Invalidate old socket BEFORE closing it.
  // ----------------------------------------------------------

  webSocketGeneration += 1;


  webSocketConnecting =
    false;


  const socket =
    webSocket;


  // ----------------------------------------------------------
  // Remove global reference.
  // ----------------------------------------------------------

  webSocket =
    null;


  if (!socket) {

    return;

  }


  // ----------------------------------------------------------
  // Close safely.
  // ----------------------------------------------------------

  try {

    if (
      socket.readyState ===
        WebSocket.OPEN ||
      socket.readyState ===
        WebSocket.CONNECTING
    ) {

      socket.close(
        1000,
        "No active SmartNotify Web Broadcast consumers"
      );

    }

  } catch (error) {

    console.warn(
      "⚠️ SmartNotify WebSocket close error:",
      error
    );

  }

};


// ============================================================
// FORCE DISCONNECT
// ============================================================
//
// Use this when logging out or shutting down the application.
//
// ============================================================

export const forceDisconnectWebBroadcast = () => {

  console.log(
    "🛑 Force disconnecting SmartNotify Web Broadcast"
  );


  webSocketIntentionalClose =
    true;


  webSocketUsers =
    0;


  webSocketCallbacks.clear();


  clearReconnectTimer();


  stopHeartbeat();


  // ----------------------------------------------------------
  // Invalidate current socket.
  // ----------------------------------------------------------

  webSocketGeneration += 1;


  webSocketConnecting =
    false;


  const socket =
    webSocket;


  webSocket =
    null;


  if (!socket) {

    return;

  }


  try {

    if (
      socket.readyState ===
        WebSocket.OPEN ||
      socket.readyState ===
        WebSocket.CONNECTING
    ) {

      socket.close(
        1000,
        "Application shutdown"
      );

    }

  } catch (error) {

    console.warn(
      "⚠️ SmartNotify WebSocket force-close error:",
      error
    );

  }

};


// ============================================================
// GET WEBSOCKET STATUS
// ============================================================

export const getWebBroadcastStatus = () => {

  let state =
    "CLOSED";


  if (
    webSocket
  ) {

    switch (
      webSocket.readyState
    ) {

      case WebSocket.CONNECTING:

        state =
          "CONNECTING";

        break;


      case WebSocket.OPEN:

        state =
          "OPEN";

        break;


      case WebSocket.CLOSING:

        state =
          "CLOSING";

        break;


      case WebSocket.CLOSED:

        state =
          "CLOSED";

        break;


      default:

        state =
          "UNKNOWN";

    }

  }


  return {

    state:

      state,

    consumers:

      webSocketUsers,

    callbacks:

      webSocketCallbacks.size,

    hasSocket:

      Boolean(
        webSocket
      ),

  };

};