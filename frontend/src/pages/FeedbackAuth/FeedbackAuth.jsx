import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  MessageSquareText,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
} from "lucide-react";

import { toast } from "react-hot-toast";

import authService from "../../services/authService";


export default function FeedbackAuth() {

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");


  // ============================================================
  // AUTH MODE
  // ============================================================

  const [mode, setMode] = useState("login");


  // ============================================================
  // FORM STATE
  // ============================================================

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");


  // ============================================================
  // PASSWORD VISIBILITY
  // ============================================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);


  // ============================================================
  // LOADING
  // ============================================================

  const [loading, setLoading] = useState(false);


  // ============================================================
  // CONTINUE TO FEEDBACK
  // ============================================================

  const continueToFeedback = () => {

    if (!token) {

      toast.error(
        "This feedback link is missing its token."
      );

      return;
    }


    navigate(
      `/feedback-response?token=${encodeURIComponent(
        token
      )}`
    );
  };


  // ============================================================
  // LOGIN
  // ============================================================

  const handleLogin = async (event) => {

    event.preventDefault();


    if (!token) {

      toast.error(
        "Invalid feedback link."
      );

      return;
    }


    if (!email.trim()) {

      toast.error(
        "Please enter your email."
      );

      return;
    }


    if (!password) {

      toast.error(
        "Please enter your password."
      );

      return;
    }


    try {

      setLoading(true);


      const response =
        await authService.feedbackLogin(
          email.trim().toLowerCase(),
          password
        );


      const data = response;


      // ========================================================
      // SAVE FEEDBACK AUTHENTICATION
      // ========================================================

      if (data?.access_token) {

        localStorage.setItem(
          "feedback_access_token",
          data.access_token
        );
      }


      if (data?.refresh_token) {

        localStorage.setItem(
          "feedback_refresh_token",
          data.refresh_token
        );
      }


      if (data?.user) {

        localStorage.setItem(
          "feedback_user",
          JSON.stringify(data.user)
        );
      }


      toast.success(
        "Signed in successfully."
      );


      continueToFeedback();


    } catch (error) {

      console.error(
        "Feedback login failed:",
        error?.response?.data ||
          error?.message
      );


      const detail =
        error?.response?.data?.detail;


      let message =
        "Unable to sign in. Please check your email and password.";


      if (typeof detail === "string") {

        message = detail;

      } else if (Array.isArray(detail)) {

        message = detail
          .map(
            (item) => item?.msg
          )
          .filter(Boolean)
          .join(", ");
      }


      toast.error(message);


    } finally {

      setLoading(false);
    }
  };


  // ============================================================
  // REGISTER
  // ============================================================

  const handleRegister = async (event) => {

    event.preventDefault();


    if (!token) {

      toast.error(
        "Invalid feedback link."
      );

      return;
    }


    if (!name.trim()) {

      toast.error(
        "Please enter your name."
      );

      return;
    }


    if (!email.trim()) {

      toast.error(
        "Please enter your email."
      );

      return;
    }


    if (!password) {

      toast.error(
        "Please enter a password."
      );

      return;
    }


    if (password.length < 8) {

      toast.error(
        "Password must contain at least 8 characters."
      );

      return;
    }


    if (password !== confirmPassword) {

      toast.error(
        "Passwords do not match."
      );

      return;
    }


    try {

      setLoading(true);


      const normalizedEmail =
        email.trim().toLowerCase();


      // ========================================================
      // REGISTER USER
      // ========================================================

      const registerResponse =
        await authService.feedbackRegister(
          name.trim(),
          normalizedEmail,
          password
        );


      console.log(
        "Feedback registration successful:",
        registerResponse
      );


      // ========================================================
      // AUTOMATIC LOGIN AFTER REGISTRATION
      // ========================================================

      const loginResponse =
        await authService.feedbackLogin(
          normalizedEmail,
          password
        );


      const data =
        loginResponse;


      // ========================================================
      // SAVE AUTHENTICATION INFORMATION
      // ========================================================

      if (data?.access_token) {

        localStorage.setItem(
          "feedback_access_token",
          data.access_token
        );
      }


      if (data?.refresh_token) {

        localStorage.setItem(
          "feedback_refresh_token",
          data.refresh_token
        );
      }


      if (data?.user) {

        localStorage.setItem(
          "feedback_user",
          JSON.stringify(data.user)
        );

      } else {

        localStorage.setItem(
          "feedback_user",
          JSON.stringify({
            name: name.trim(),
            email: normalizedEmail,
          })
        );
      }


      toast.success(
        "Account created successfully!"
      );


      // ========================================================
      // REDIRECT TO FEEDBACK FORM
      // ========================================================

      navigate(
        `/feedback-response?token=${encodeURIComponent(
          token
        )}`
      );


    } catch (error) {

      console.error(
        "Feedback registration failed:",
        error?.response?.data ||
          error?.message
      );


      const detail =
        error?.response?.data?.detail;


      let message =
        "Unable to create account. Please try again.";


      if (typeof detail === "string") {

        message = detail;

      } else if (Array.isArray(detail)) {

        message = detail
          .map(
            (item) => item?.msg
          )
          .filter(Boolean)
          .join(", ");
      }


      toast.error(message);


    } finally {

      setLoading(false);
    }
  };


  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  const handleForgotPassword = async (
    event
  ) => {

    event.preventDefault();


    if (!email.trim()) {

      toast.error(
        "Please enter your email address."
      );

      return;
    }


    try {

      setLoading(true);


      const normalizedEmail =
        email.trim().toLowerCase();


      await authService.forgotPassword(
        normalizedEmail
      );


      toast.success(
        "If an account exists for this email, a password reset link has been sent."
      );


      // Keep email visible and return
      // to login after a short moment.

      setTimeout(() => {

        setMode("login");

      }, 1200);


    } catch (error) {

      console.error(
        "Forgot password failed:",
        error?.response?.data ||
          error?.message
      );


      const detail =
        error?.response?.data?.detail;


      let message =
        "Unable to process your request. Please try again.";


      if (typeof detail === "string") {

        message = detail;
      }


      toast.error(message);


    } finally {

      setLoading(false);
    }
  };


  // ============================================================
  // SWITCH LOGIN / REGISTER
  // ============================================================

  const switchMode = (
    nextMode
  ) => {

    setMode(nextMode);

    setPassword("");

    setConfirmPassword("");

    setShowPassword(false);

    setShowConfirmPassword(false);
  };


  // ============================================================
  // BACK FROM FORGOT PASSWORD
  // ============================================================

  const backToLogin = () => {

    setMode("login");

    setPassword("");

    setConfirmPassword("");

    setShowPassword(false);

    setShowConfirmPassword(false);
  };


  // ============================================================
  // UI
  // ============================================================

  return (

    <div
      style={{
        minHeight: "100vh",

        background:
          "linear-gradient(135deg, #f5f8ff 0%, #eef4ff 45%, #f8faff 100%)",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        padding: "32px 18px",
      }}
    >

      <div
        style={{
          width: "100%",

          maxWidth: "470px",
        }}
      >

        {/* ======================================================
            BRAND
        ======================================================= */}

        <div
          style={{
            textAlign: "center",

            marginBottom: "22px",
          }}
        >

          <div
            style={{
              width: "58px",

              height: "58px",

              margin: "0 auto 12px",

              borderRadius: "17px",

              background:
                "linear-gradient(135deg, #2563eb, #4f46e5)",

              color: "#fff",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              fontWeight: 800,

              fontSize: "20px",

              boxShadow:
                "0 12px 28px rgba(37,99,235,0.25)",
            }}
          >
            SN
          </div>


          <h1
            style={{
              margin: 0,

              color: "#07152f",

              fontSize: "25px",

              fontWeight: 800,
            }}
          >
            SmartNotify
          </h1>


          <p
            style={{
              margin: "5px 0 0",

              color: "#64748b",

              fontSize: "14px",
            }}
          >
            Engagement Feedback
          </p>

        </div>


        {/* ======================================================
            CARD
        ======================================================= */}

        <div
          style={{
            background: "#ffffff",

            border: "1px solid #e2e8f0",

            borderRadius: "24px",

            padding: "34px",

            boxShadow:
              "0 20px 60px rgba(15,23,42,0.10)",
          }}
        >

          {/* ====================================================
              ICON
          ===================================================== */}

          <div
            style={{
              width: "52px",

              height: "52px",

              borderRadius: "15px",

              background: "#eff6ff",

              color: "#2563eb",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              marginBottom: "20px",
            }}
          >

            {mode === "forgot" ? (
              <KeyRound size={25} />
            ) : (
              <MessageSquareText size={25} />
            )}

          </div>


          {/* ====================================================
              TITLE
          ===================================================== */}

          <h2
            style={{
              margin: 0,

              color: "#07152f",

              fontSize: "27px",

              fontWeight: 800,
            }}
          >

            {mode === "forgot"
              ? "Reset your password"
              : "We'd love your feedback"}

          </h2>


          <p
            style={{
              margin: "8px 0 25px",

              color: "#64748b",

              lineHeight: 1.6,

              fontSize: "14px",
            }}
          >

            {mode === "forgot"
              ? "Enter your feedback account email and we'll send you a password reset link."
              : "Sign in to your SmartNotify feedback account to share your experience."}

          </p>


          {/* ====================================================
              LOGIN / REGISTER TABS
          ===================================================== */}

          {mode !== "forgot" && (

            <div
              style={{
                display: "grid",

                gridTemplateColumns:
                  "1fr 1fr",

                background: "#f1f5f9",

                padding: "4px",

                borderRadius: "12px",

                marginBottom: "25px",
              }}
            >

              <button
                type="button"

                onClick={() =>
                  switchMode("login")
                }

                style={{
                  border: "none",

                  borderRadius: "9px",

                  padding: "11px",

                  background:
                    mode === "login"
                      ? "#ffffff"
                      : "transparent",

                  color:
                    mode === "login"
                      ? "#2563eb"
                      : "#64748b",

                  fontWeight: 700,

                  cursor: "pointer",

                  boxShadow:
                    mode === "login"
                      ? "0 2px 8px rgba(15,23,42,0.08)"
                      : "none",
                }}
              >
                Sign In
              </button>


              <button
                type="button"

                onClick={() =>
                  switchMode("register")
                }

                style={{
                  border: "none",

                  borderRadius: "9px",

                  padding: "11px",

                  background:
                    mode === "register"
                      ? "#ffffff"
                      : "transparent",

                  color:
                    mode === "register"
                      ? "#2563eb"
                      : "#64748b",

                  fontWeight: 700,

                  cursor: "pointer",

                  boxShadow:
                    mode === "register"
                      ? "0 2px 8px rgba(15,23,42,0.08)"
                      : "none",
                }}
              >
                Create Account
              </button>

            </div>
          )}


          {/* ====================================================
              FORGOT PASSWORD
          ===================================================== */}

          {mode === "forgot" && (

            <form
              onSubmit={
                handleForgotPassword
              }
              autoComplete="on"
            >

              <Field
                label="Email address"
                icon={Mail}
                type="email"
                name="username"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="username"
              />


              <button
                type="submit"

                disabled={loading}

                style={{
                  ...primaryButtonStyle,

                  opacity:
                    loading ? 0.7 : 1,

                  cursor:
                    loading
                      ? "not-allowed"
                      : "pointer",

                  marginTop: "23px",
                }}
              >

                {loading
                  ? "Sending..."
                  : "Send Reset Link"}

                {!loading && (
                  <ArrowRight size={18} />
                )}

              </button>


              <button
                type="button"

                onClick={backToLogin}

                style={{
                  width: "100%",

                  marginTop: "13px",

                  height: "45px",

                  border: "1px solid #dbe3ee",

                  borderRadius: "11px",

                  background: "#ffffff",

                  color: "#475569",

                  fontSize: "14px",

                  fontWeight: 700,

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",

                  gap: "7px",

                  cursor: "pointer",
                }}
              >

                <ArrowLeft size={17} />

                Back to Sign In

              </button>

            </form>
          )}


          {/* ====================================================
              LOGIN
          ===================================================== */}

          {mode === "login" && (

            <form
              onSubmit={handleLogin}

              autoComplete="on"
            >

              <Field
                label="Email address"
                icon={Mail}
                type="email"
                name="username"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="username"
              />


              <div
                style={{
                  marginTop: "17px",
                }}
              >

                <label
                  style={{
                    display: "block",

                    marginBottom: "7px",

                    fontSize: "13px",

                    fontWeight: 700,

                    color: "#334155",
                  }}
                >
                  Password
                </label>


                <div
                  style={{
                    position: "relative",
                  }}
                >

                  <Lock
                    size={18}

                    style={{
                      position: "absolute",

                      left: "14px",

                      top: "14px",

                      color: "#94a3b8",
                    }}
                  />


                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }

                    name="password"

                    value={password}

                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }

                    placeholder="Enter your password"

                    autoComplete="current-password"

                    style={inputStyle}
                  />


                  <button
                    type="button"

                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }

                    style={eyeButtonStyle}

                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >

                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}

                  </button>

                </div>


                {/* ==================================================
                    FORGOT PASSWORD LINK
                =================================================== */}

                <div
                  style={{
                    display: "flex",

                    justifyContent: "flex-end",

                    marginTop: "9px",
                  }}
                >

                  <button
                    type="button"

                    onClick={() =>
                      switchMode("forgot")
                    }

                    style={{
                      border: "none",

                      background: "transparent",

                      padding: 0,

                      color: "#2563eb",

                      fontSize: "13px",

                      fontWeight: 700,

                      cursor: "pointer",
                    }}
                  >
                    Forgot password?
                  </button>

                </div>

              </div>


              <button
                type="submit"

                disabled={loading}

                style={{
                  ...primaryButtonStyle,

                  opacity:
                    loading ? 0.7 : 1,

                  cursor:
                    loading
                      ? "not-allowed"
                      : "pointer",

                  marginTop: "18px",
                }}
              >

                {loading
                  ? "Signing in..."
                  : "Sign In"}

                {!loading && (
                  <ArrowRight size={18} />
                )}

              </button>

            </form>
          )}


          {/* ====================================================
              REGISTER
          ===================================================== */}

          {mode === "register" && (

            <form
              onSubmit={handleRegister}

              autoComplete="on"
            >

              <Field
                label="Full name"
                icon={User}
                type="text"
                name="name"
                value={name}
                onChange={setName}
                placeholder="Your name"
                autoComplete="name"
              />


              <div
                style={{
                  marginTop: "17px",
                }}
              >

                <Field
                  label="Email address"
                  icon={Mail}
                  type="email"
                  name="username"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  autoComplete="username"
                />

              </div>


              <div
                style={{
                  marginTop: "17px",
                }}
              >

                <PasswordField
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  visible={showPassword}
                  setVisible={
                    setShowPassword
                  }
                  autoComplete="new-password"
                />

              </div>


              <div
                style={{
                  marginTop: "17px",
                }}
              >

                <PasswordField
                  label="Confirm password"
                  value={confirmPassword}
                  onChange={
                    setConfirmPassword
                  }
                  visible={
                    showConfirmPassword
                  }
                  setVisible={
                    setShowConfirmPassword
                  }
                  autoComplete="new-password"
                />

              </div>


              <button
                type="submit"

                disabled={loading}

                style={{
                  ...primaryButtonStyle,

                  opacity:
                    loading ? 0.7 : 1,

                  cursor:
                    loading
                      ? "not-allowed"
                      : "pointer",
                }}
              >

                {loading
                  ? "Creating Account..."
                  : "Create Account"}

                {!loading && (
                  <ArrowRight size={18} />
                )}

              </button>

            </form>
          )}


          {/* ====================================================
              SECURITY NOTE
          ===================================================== */}

          <div
            style={{
              display: "flex",

              gap: "9px",

              alignItems: "flex-start",

              marginTop: "22px",

              padding: "13px",

              borderRadius: "12px",

              background: "#f8fafc",

              color: "#64748b",

              fontSize: "12px",

              lineHeight: 1.5,
            }}
          >

            <ShieldCheck
              size={17}

              style={{
                flexShrink: 0,

                color: "#2563eb",
              }}
            />


            <span>

              Your feedback account is separate
              from SmartNotify's internal
              communication team accounts.

            </span>

          </div>

        </div>


        {/* ======================================================
            FOOTER
        ======================================================= */}

        <p
          style={{
            textAlign: "center",

            marginTop: "18px",

            color: "#94a3b8",

            fontSize: "12px",
          }}
        >
          SmartNotify • Public Awareness Communication
        </p>

      </div>

    </div>
  );
}


// ============================================================
// FIELD
// ============================================================

function Field({
  label,
  icon: Icon,
  type,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
}) {

  return (

    <>
      <label
        style={{
          display: "block",

          marginBottom: "7px",

          fontSize: "13px",

          fontWeight: 700,

          color: "#334155",
        }}
      >
        {label}
      </label>


      <div
        style={{
          position: "relative",
        }}
      >

        <Icon
          size={18}

          style={{
            position: "absolute",

            left: "14px",

            top: "14px",

            color: "#94a3b8",
          }}
        />


        <input
          type={type}

          name={name}

          value={value}

          onChange={(event) =>
            onChange(
              event.target.value
            )
          }

          placeholder={placeholder}

          autoComplete={autoComplete}

          style={inputStyle}
        />

      </div>
    </>
  );
}


// ============================================================
// PASSWORD FIELD
// ============================================================

function PasswordField({
  label,
  value,
  onChange,
  visible,
  setVisible,
  autoComplete,
}) {

  return (

    <>
      <label
        style={{
          display: "block",

          marginBottom: "7px",

          fontSize: "13px",

          fontWeight: 700,

          color: "#334155",
        }}
      >
        {label}
      </label>


      <div
        style={{
          position: "relative",
        }}
      >

        <Lock
          size={18}

          style={{
            position: "absolute",

            left: "14px",

            top: "14px",

            color: "#94a3b8",
          }}
        />


        <input
          type={
            visible
              ? "text"
              : "password"
          }

          name={
            label === "Password"
              ? "new-password"
              : "confirm-password"
          }

          value={value}

          onChange={(event) =>
            onChange(
              event.target.value
            )
          }

          placeholder={
            label === "Password"
              ? "Create a password"
              : "Confirm your password"
          }

          autoComplete={autoComplete}

          style={inputStyle}
        />


        <button
          type="button"

          onClick={() =>
            setVisible(!visible)
          }

          style={eyeButtonStyle}

          aria-label={
            visible
              ? "Hide password"
              : "Show password"
          }
        >

          {visible ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}

        </button>

      </div>
    </>
  );
}


// ============================================================
// STYLES
// ============================================================

const inputStyle = {

  width: "100%",

  boxSizing: "border-box",

  height: "47px",

  border:
    "1px solid #dbe3ee",

  borderRadius: "11px",

  padding: "0 44px",

  fontSize: "14px",

  color: "#0f172a",

  outline: "none",

  background: "#ffffff",
};


const eyeButtonStyle = {

  position: "absolute",

  right: "10px",

  top: "8px",

  width: "32px",

  height: "32px",

  border: "none",

  background: "transparent",

  color: "#64748b",

  cursor: "pointer",
};


const primaryButtonStyle = {

  width: "100%",

  height: "49px",

  marginTop: "23px",

  border: "none",

  borderRadius: "11px",

  background:
    "linear-gradient(135deg, #2563eb, #4f46e5)",

  color: "#ffffff",

  fontSize: "14px",

  fontWeight: 800,

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  gap: "8px",

  cursor: "pointer",

  boxShadow:
    "0 10px 25px rgba(37,99,235,0.22)",
};