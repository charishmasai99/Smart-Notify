import { useEffect, useRef, useState } from "react";
import {
  MessageSquareText,
  Star,
  CheckCircle2,
  Loader2,
  Mic,
  MicOff,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import feedbackService from "../../services/feedbackService";


const VOICE_LANGUAGES = [
  ["English", "English", "en-IN"],
  ["Telugu", "Telugu", "te-IN"],
  ["Hindi", "Hindi", "hi-IN"],
  ["Tamil", "Tamil", "ta-IN"],
  ["Kannada", "Kannada", "kn-IN"],
  ["Malayalam", "Malayalam", "ml-IN"],
  ["Marathi", "Marathi", "mr-IN"],
  ["Bengali", "Bengali", "bn-IN"],
];

const getReadableError = (error, fallback) => {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object") {
          return (
            item.msg ||
            item.message ||
            "Validation error"
          );
        }

        return "Validation error";
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(", ");
    }
  }

  if (detail && typeof detail === "object") {
    return (
      detail.msg ||
      detail.message ||
      fallback
    );
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
};


const FeedbackResponse = () => {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [details, setDetails] = useState(null);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");

  const [language, setLanguage] = useState("English");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const recognitionRef = useRef(null);

  const voiceSupported =
    typeof window !== "undefined" &&
    Boolean(
      window.SpeechRecognition ||
        window.webkitSpeechRecognition
    );

  // ============================================================
  // LOAD FEEDBACK DETAILS
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const loadDetails = async () => {
      if (!token) {
        if (!cancelled) {
          setError(
            "This feedback link is missing a tracking token."
          );
          setLoading(false);
        }

        return;
      }

      try {
        const data =
          await feedbackService.getResponseDetails(token);

        if (!cancelled) {
          setDetails(data);
          setError("");
        }
      } catch (err) {
        console.error(
          "Feedback details failed:",
          err?.response?.data || err?.message
        );

        if (!cancelled) {
          setError(
            err?.response?.data?.detail ||
              "This feedback link is invalid or expired."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDetails();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // ============================================================
  // VOICE RECOGNITION
  // ============================================================

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Recognition may already be stopped.
        }

        recognitionRef.current = null;
      }
    };
  }, []);

  const getSelectedVoiceLanguage = () => {
    return (
      VOICE_LANGUAGES.find(
        ([value]) => value === language
      ) || VOICE_LANGUAGES[0]
    );
  };

  const translateVoiceText = async (text) => {
    const cleanedText = text.trim();

    if (!cleanedText) {
      return "";
    }

    // English does not need translation.
    if (language === "English") {
      return cleanedText;
    }

    try {
      const response =
        await feedbackService.translateFeedback(
          cleanedText,
          language
        );

      return response?.content || cleanedText;
    } catch (error) {
      console.error(
        "Feedback voice translation failed:",
        error?.response?.data || error?.message
      );

      toast.error(
        "Translation failed. The recognized text was added instead."
      );

      return cleanedText;
    }
  };

  const startVoiceInput = () => {
    if (!voiceSupported) {
      const message =
        "Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge.";

      setVoiceError(message);
      toast.error(message);

      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(
        "Voice input is not supported in this browser."
      );

      return;
    }

    const [
      ,
      ,
      recognitionLanguage,
    ] = getSelectedVoiceLanguage();

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = recognitionLanguage;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceError("");
    };

    recognition.onresult = async (event) => {
      let finalTranscript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i += 1
      ) {
        const transcript =
          event.results[i][0]?.transcript || "";

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }

      if (!finalTranscript.trim()) {
        return;
      }

      const translatedText =
        await translateVoiceText(
          finalTranscript
        );

      if (!translatedText.trim()) {
        return;
      }

      setMessage((previous) => {
        const existing = previous.trim();

        return existing
          ? `${existing} ${translatedText.trim()}`
          : translatedText.trim();
      });
    };

    recognition.onerror = (event) => {
      console.error(
        "VOICE RECOGNITION ERROR:",
        event
      );

      setIsListening(false);

      let errorMessage =
        "Voice input failed.";

      if (event.error === "not-allowed") {
        errorMessage =
          "Microphone permission was denied. Please allow microphone access.";
      } else if (event.error === "no-speech") {
        errorMessage =
          "No speech detected. Please try again.";
      } else if (event.error === "audio-capture") {
        errorMessage =
          "No microphone was detected.";
      }

      setVoiceError(errorMessage);
      toast.error(errorMessage);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error(
        "Unable to start voice input:",
        error
      );

      setIsListening(false);
      recognitionRef.current = null;

      toast.error(
        "Unable to start voice input. Please try again."
      );
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Already stopped.
      }

      recognitionRef.current = null;
    }

    setIsListening(false);
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopVoiceInput();
    } else {
      startVoiceInput();
    }
  };

  // ============================================================
  // SUBMIT FEEDBACK
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      toast.error("Invalid feedback link.");
      return;
    }

    if (rating < 1) {
      toast.error("Please select a rating.");
      return;
    }

    if (!message.trim()) {
      toast.error("Please write your feedback.");
      return;
    }

    if (isListening) {
      stopVoiceInput();
    }

    // The feedback details request must complete before a submission
    // can be created. Never send NaN/null campaign IDs to FastAPI.
    const campaignId = Number(
      details?.campaign_id
    );

    if (!Number.isInteger(campaignId) || campaignId < 1) {
      toast.error(
        "Unable to identify the campaign for this feedback link. Please reopen the feedback link."
      );
      return;
    }

    const deliveryId = details?.delivery_id
      ? Number(details.delivery_id)
      : null;

    if (
      deliveryId !== null &&
      (!Number.isInteger(deliveryId) ||
        deliveryId < 1)
    ) {
      toast.error(
        "Unable to identify the delivery for this feedback link. Please reopen the feedback link."
      );
      return;
    }

    const feedbackPayload = {
      campaign_id: campaignId,

      delivery_id: deliveryId,

      recipient:
        details?.recipient || null,

      channel:
        details?.channel || "email",

      message: message.trim(),

      language,

      rating: Number(rating),
    };

    console.log(
      "FEEDBACK SUBMISSION PAYLOAD:",
      feedbackPayload
    );

    setSubmitting(true);

    try {
      await feedbackService.submitResponse(
        token,
        feedbackPayload
      );

      setSubmitted(true);

      toast.success(
        "Thank you for your feedback!"
      );
    } catch (err) {
      console.error(
        "Feedback submission failed:",
        err?.response?.data || err?.message
      );

      toast.error(
        getReadableError(
          err,
          "Unable to submit feedback."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f8fc",
          padding: "24px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            color: "#64748b",
          }}
        >
          <Loader2
            size={34}
            className="animate-spin"
            style={{
              margin: "0 auto 12px",
            }}
          />

          <p>
            Loading feedback form...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#f5f8fc",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "520px",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "20px",
            padding: "42px 32px",
            textAlign: "center",
            boxShadow:
              "0 15px 45px rgba(15,23,42,0.08)",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 18px",
              borderRadius: "50%",
              background: "#fef2f2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            !
          </div>

          <h1
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: "24px",
            }}
          >
            Feedback link unavailable
          </h1>

          <p
            style={{
              margin: "12px 0 0",
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            {error}
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // SUCCESS
  // ============================================================

  if (submitted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#f5f8fc",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "520px",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "20px",
            padding: "44px 32px",
            textAlign: "center",
            boxShadow:
              "0 15px 45px rgba(15,23,42,0.08)",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 18px",
              borderRadius: "50%",
              background: "#ecfdf5",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle2 size={34} />
          </div>

          <h1
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: "25px",
            }}
          >
            Thank you!
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            Your feedback has been
            successfully submitted.
            Your response helps improve
            future SmartNotify
            communications.
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // FORM
  // ============================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#f5f8fc",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "620px",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "20px",
          padding: "34px",
          boxShadow:
            "0 15px 45px rgba(15,23,42,0.08)",
        }}
      >
        {/* BRAND */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "11px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "11px",
              background: "#2563eb",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "14px",
            }}
          >
            SN
          </div>

          <div>
            <strong
              style={{
                display: "block",
                color: "#0f172a",
                fontSize: "17px",
              }}
            >
              SmartNotify
            </strong>

            <span
              style={{
                color: "#94a3b8",
                fontSize: "12px",
              }}
            >
              Engagement Feedback
            </span>
          </div>
        </div>

        {/* HEADER */}

        <div
          style={{
            marginBottom: "26px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "14px",
            }}
          >
            <MessageSquareText size={22} />
          </div>

          <h1
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: "27px",
            }}
          >
            We'd love your feedback
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            Tell us how useful this
            communication was to you.
          </p>

          {details?.campaign_name && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "11px",
                  color: "#94a3b8",
                  marginBottom: "3px",
                }}
              >
                CAMPAIGN
              </span>

              <strong
                style={{
                  color: "#334155",
                }}
              >
                {details.campaign_name}
              </strong>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>

          {/* RATING */}

          <div
            style={{
              marginBottom: "24px",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 700,
                color: "#334155",
                marginBottom: "10px",
              }}
            >
              How would you rate this
              communication?
            </label>

            <div
              style={{
                display: "flex",
                gap: "8px",
              }}
            >
              {[1, 2, 3, 4, 5].map(
                (value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setRating(value)
                    }
                    aria-label={`${value} star`}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      padding: "2px",
                      color:
                        value <= rating
                          ? "#f59e0b"
                          : "#cbd5e1",
                    }}
                  >
                    <Star
                      size={32}
                      fill={
                        value <= rating
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                )
              )}
            </div>
          </div>

          {/* FEEDBACK WITH VOICE INPUT */}

          <div
            style={{
              marginBottom: "24px",
            }}
          >
            <label
              htmlFor="feedback-message"
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 700,
                color: "#334155",
                marginBottom: "9px",
              }}
            >
              Your feedback
            </label>

            <div
              style={{
                position: "relative",
                border: "1px solid #dbe2ea",
                borderRadius: "12px",
                background: "#ffffff",
                overflow: "hidden",
              }}
            >
              <textarea
                id="feedback-message"
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value
                  )
                }
                placeholder="Tell us what you think, or use the microphone to speak..."
                rows={7}
                maxLength={2000}
                style={{
                  display: "block",
                  width: "100%",
                  resize: "vertical",
                  border: "none",
                  padding: "14px 14px 68px",
                  outline: "none",
                  color: "#0f172a",
                  lineHeight: 1.5,
                  boxSizing: "border-box",
                  minHeight: "180px",
                }}
              />

              {/* VOICE CONTROLS */}

              <div
                style={{
                  position: "absolute",
                  right: "10px",
                  bottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <select
                  value={language}
                  onChange={(event) => {
                    setLanguage(
                      event.target.value
                    );
                    setVoiceError("");
                  }}
                  disabled={isListening}
                  aria-label="Voice input language"
                  style={{
                    height: "40px",
                    minWidth: "110px",
                    border:
                      "1px solid #dbe2ea",
                    borderRadius: "10px",
                    padding: "0 32px 0 12px",
                    background: "#ffffff",
                    color: "#334155",
                    fontSize: "13px",
                    fontWeight: 600,
                    outline: "none",
                    cursor: isListening
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {VOICE_LANGUAGES.map(
                    ([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    )
                  )}
                </select>

                <button
                  type="button"
                  onClick={
                    toggleVoiceInput
                  }
                  disabled={
                    !voiceSupported ||
                    submitting
                  }
                  title={
                    !voiceSupported
                      ? "Voice input is not supported in this browser"
                      : isListening
                      ? "Stop voice input"
                      : "Start voice input"
                  }
                  style={{
                    height: "40px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "7px",
                    padding: "0 13px",
                    border:
                      "1px solid #cbd5e1",
                    borderRadius: "10px",
                    background:
                      isListening
                        ? "#eff6ff"
                        : "#ffffff",
                    color:
                      isListening
                        ? "#2563eb"
                        : "#334155",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor:
                      !voiceSupported ||
                      submitting
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {isListening ? (
                    <MicOff size={17} />
                  ) : (
                    <Mic size={17} />
                  )}

                  <span>
                    {isListening
                      ? "Listening..."
                      : "Voice Input"}
                  </span>
                </button>
              </div>
            </div>

            {isListening && (
              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#2563eb",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#2563eb",
                    display: "inline-block",
                  }}
                />

                Listening in {language}...
                Speak clearly. Your words
                will be translated and added
                to the feedback.
              </div>
            )}

            {voiceError && !isListening && (
              <div
                style={{
                  marginTop: "8px",
                  color: "#dc2626",
                  fontSize: "12px",
                }}
              >
                {voiceError}
              </div>
            )}

            <div
              style={{
                marginTop: "6px",
                textAlign: "right",
                fontSize: "11px",
                color: "#94a3b8",
              }}
            >
              {message.length}/2000
            </div>
          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              height: "46px",
              border: "none",
              borderRadius: "10px",
              background: submitting
                ? "#93c5fd"
                : "#2563eb",
              color: "#ffffff",
              fontWeight: 700,
              cursor: submitting
                ? "not-allowed"
                : "pointer",
            }}
          >
            {submitting
              ? "Submitting..."
              : "Submit Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackResponse;