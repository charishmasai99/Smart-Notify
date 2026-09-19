import { initializeApp } from "firebase/app";

import {
  getMessaging,
  isSupported,
  onMessage,
} from "firebase/messaging";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";


const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY,

  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,

  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID,

  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,

  messagingSenderId:
    import.meta.env
      .VITE_FIREBASE_MESSAGING_SENDER_ID,

  appId:
    import.meta.env.VITE_FIREBASE_APP_ID,
};


const app = initializeApp(
  firebaseConfig
);


// ============================================================
// FIREBASE MESSAGING
// ============================================================

export const firebaseAuth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(
    firebaseAuth,
    googleProvider
  );

  const idToken = await result.user.getIdToken();

  return {
    idToken,
    user: result.user,
  };
};

export const signOutFromFirebase = async () => {
  await signOut(firebaseAuth);
};


// ============================================================
// FIREBASE MESSAGING
// ============================================================

export const getFirebaseMessaging =
  async () => {

    const supported =
      await isSupported();

    if (!supported) {

      console.warn(
        "Firebase Cloud Messaging is not supported in this browser."
      );

      return null;
    }

    return getMessaging(app);
  };


// ============================================================
// VAPID KEY
// ============================================================

export const firebaseVapidKey =
  import.meta.env
    .VITE_FIREBASE_VAPID_KEY;


// ============================================================
// FOREGROUND FCM MESSAGES
// ============================================================

export const listenForForegroundMessages =
  async (callback) => {

    const messaging =
      await getFirebaseMessaging();

    if (!messaging) {
      return null;
    }

    return onMessage(
      messaging,
      (payload) => {

        console.log(
          "FOREGROUND FCM MESSAGE:",
          payload
        );


        // ----------------------------------------------------
        // Existing callback
        // ----------------------------------------------------

        if (callback) {
          callback(payload);
        }


        // ----------------------------------------------------
        // Notify Navbar immediately
        // ----------------------------------------------------

        window.dispatchEvent(
          new CustomEvent(
            "fcm-notification-received",
            {
              detail: payload,
            }
          )
        );

      }
    );
  };


export default app;