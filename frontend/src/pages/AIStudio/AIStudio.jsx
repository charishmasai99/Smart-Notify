import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  ArrowRight,
  Check,
  Clipboard,
  FileText,
  Globe2,
  Megaphone,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  WandSparkles,
  Mic,
  MicOff,
} from "lucide-react";

import api from "../../config/apiConfig";
import aiService from "../../services/aiService";

import "./AIStudio.css";


// ============================================================
// AI TABS
// ============================================================

const TABS = [
  {
    id: "generate",
    label: "Generate",
    icon: Sparkles,
  },
  {
    id: "personalize",
    label: "Personalize",
    icon: UserRound,
  },
  {
    id: "tone",
    label: "Tone",
    icon: Target,
  },
  {
    id: "policy",
    label: "Policy",
    icon: ShieldCheck,
  },
  {
    id: "translate",
    label: "Translate",
    icon: Globe2,
  },
];


// ============================================================
// LANGUAGES
// ============================================================

const LANGUAGES = [
  ["telugu", "Telugu"],
  ["hindi", "Hindi"],
  ["tamil", "Tamil"],
  ["kannada", "Kannada"],
  ["malayalam", "Malayalam"],
  ["marathi", "Marathi"],
  ["bengali", "Bengali"],
  ["english", "English"],
];


// ============================================================
// VOICE LANGUAGES
// ============================================================

const VOICE_LANGUAGES = [
  ["en-IN", "English"],
  ["te-IN", "Telugu"],
  ["hi-IN", "Hindi"],
  ["ta-IN", "Tamil"],
  ["kn-IN", "Kannada"],
  ["ml-IN", "Malayalam"],
  ["mr-IN", "Marathi"],
  ["bn-IN", "Bengali"],
];


// ============================================================
// PERSONALIZATION FIELDS
// ============================================================

const PERSONALIZATION_FIELDS = [
  {
    value: "first_name",
    label: "First Name",
    placeholder: "{{first_name}}",
  },
  {
    value: "last_name",
    label: "Last Name",
    placeholder: "{{last_name}}",
  },
  {
    value: "city",
    label: "City",
    placeholder: "{{city}}",
  },
  {
    value: "language",
    label: "Language",
    placeholder: "{{language}}",
  },
  {
    value: "occupation",
    label: "Occupation",
    placeholder: "{{occupation}}",
  },
];


// ============================================================
// DATE FORMAT
// ============================================================

function formatDateTimeLocal(
  date = new Date()
) {
  const pad = (value) =>
    String(value).padStart(2, "0");

  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())}T` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}`
  );
}


// ============================================================
// COMPONENT
// ============================================================

export default function AIStudio() {
  const navigate = useNavigate();


  // ==========================================================
  // UI STATE
  // ==========================================================

  const [activeTab, setActiveTab] =
    useState("generate");

  const [loading, setLoading] =
    useState(false);


  // ==========================================================
  // AUDIENCES
  // ==========================================================

  const [audiences, setAudiences] =
    useState([]);


  // ==========================================================
  // AI RESULTS
  // ==========================================================

  const [toneResult, setToneResult] =
    useState("");

  const [policyResult, setPolicyResult] =
    useState("");

  const [
    translatedContent,
    setTranslatedContent,
  ] = useState("");


  // ==========================================================
  // TRANSLATION
  // ==========================================================

  const [
    translationLanguage,
    setTranslationLanguage,
  ] = useState("telugu");
// ==========================================================
// PERSONALIZATION
// ==========================================================

const [
  personalizationFields,
  setPersonalizationFields,
] = useState([
  "first_name",
  "city",
]);

  // ==========================================================
  // VOICE INPUT
  // ==========================================================

  const [isListening, setIsListening] =
    useState(false);

  const [voiceLanguage, setVoiceLanguage] =
    useState("en-IN");

  const recognitionRef =
    useRef(null);


  // ==========================================================
  // BROWSER VOICE SUPPORT
  // ==========================================================

  const voiceSupported =
    typeof window !== "undefined" &&
    Boolean(
      window.SpeechRecognition ||
      window.webkitSpeechRecognition
    );

  const voiceSupportMessage =
    "Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge.";


  // ==========================================================
  // VOICE ERROR
  // ==========================================================

  const [voiceError, setVoiceError] =
    useState(() =>
      voiceSupported
        ? ""
        : voiceSupportMessage
    );


  // ==========================================================
  // FORM
  // ==========================================================

  const [form, setForm] = useState({
    campaign_name:
      "New Public Awareness Campaign",

    subject: "",

    content: "",

    audience_id: "",

    campaign_type:
      "announcement",

    ai_audience:
      "general public",

    tone:
      "professional",

    schedule_time:
      formatDateTimeLocal(),
  });


  // ==========================================================
  // LOAD AUDIENCES
  // ==========================================================

  useEffect(() => {
    const loadAudiences =
      async () => {
        try {
          const response =
            await api.get(
              "/audience/"
            );

          const data =
            Array.isArray(
              response.data
            )
              ? response.data
              : response.data?.items ||
                [];

          setAudiences(data);
        } catch (error) {
          console.error(
            "AI STUDIO AUDIENCE ERROR:",
            error
          );

          setAudiences([]);

          toast.error(
            "Unable to load audiences."
          );
        }
      };

    loadAudiences();
  }, []);


  // ==========================================================
  // VOICE RECOGNITION SETUP
  // ==========================================================

  useEffect(() => {
    if (!voiceSupported) {
      recognitionRef.current =
        null;

      return undefined;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return undefined;
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous = true;

    recognition.interimResults = true;

    recognition.lang =
      voiceLanguage;


    // ========================================================
    // RECOGNITION START
    // ========================================================

    recognition.onstart = () => {
      setIsListening(true);

      setVoiceError("");
    };


    // ========================================================
    // RECOGNITION RESULT
    // ========================================================

    recognition.onresult = (
      event
    ) => {
      let finalTranscript =
        "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i += 1
      ) {
        const transcript =
          event.results[i][0]
            ?.transcript || "";

        if (
          event.results[i]
            .isFinal
        ) {
          finalTranscript +=
            transcript;
        }
      }

      if (
        finalTranscript.trim()
      ) {
        setForm(
          (previous) => {
            const existing =
              previous.content.trim();

            const separator =
              existing
                ? " "
                : "";

            return {
              ...previous,

              content:
                existing +
                separator +
                finalTranscript.trim(),
            };
          }
        );
      }
    };


    // ========================================================
    // RECOGNITION ERROR
    // ========================================================

    recognition.onerror = (
      event
    ) => {
      console.error(
        "VOICE RECOGNITION ERROR:",
        event
      );

      setIsListening(false);

      let message =
        "Voice input failed.";

      if (
        event.error ===
        "not-allowed"
      ) {
        message =
          "Microphone permission was denied. Please allow microphone access.";
      } else if (
        event.error ===
        "no-speech"
      ) {
        message =
          "No speech detected. Please try again.";
      } else if (
        event.error ===
        "audio-capture"
      ) {
        message =
          "No microphone was detected.";
      } else if (
        event.error ===
        "network"
      ) {
        message =
          "Voice recognition network error. Please try again.";
      } else if (
        event.error ===
        "service-not-allowed"
      ) {
        message =
          "Speech recognition service is not available.";
      }

      setVoiceError(message);

      if (
        event.error !==
        "aborted"
      ) {
        toast.error(message);
      }
    };


    // ========================================================
    // RECOGNITION END
    // ========================================================

    recognition.onend = () => {
      setIsListening(false);
    };


    // ========================================================
    // STORE INSTANCE
    // ========================================================

    recognitionRef.current =
      recognition;


    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {
      try {
        recognition.stop();
      } catch {
        // Recognition may already be stopped.
      }

      recognitionRef.current =
        null;
    };
  }, [
    voiceLanguage,
    voiceSupported,
  ]);


  // ==========================================================
  // SELECTED AUDIENCE
  // ==========================================================

  const selectedAudience =
    useMemo(
      () =>
        audiences.find(
          (item) =>
            String(item.id) ===
            String(
              form.audience_id
            )
        ),
      [
        audiences,
        form.audience_id,
      ]
    );


  // ==========================================================
  // UPDATE FORM
  // ==========================================================

  const update = (
    name,
    value
  ) => {
    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };


  // ==========================================================
  // ERROR HANDLER
  // ==========================================================

  const getError = (
    error,
    fallback
  ) => {
    const detail =
      error?.response?.data
        ?.detail;

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (
            typeof item ===
            "string"
          ) {
            return item;
          }

          if (item?.msg) {
            return item.msg;
          }

          return String(item);
        })
        .join(", ");
    }

    if (
      typeof detail ===
      "string"
    ) {
      return detail;
    }

    if (error?.message) {
      return error.message;
    }

    return fallback;
  };


  // ==========================================================
  // REQUIRE CONTENT
  // ==========================================================

  const requireContent =
    () => {
      if (
        !form.content.trim()
      ) {
        toast.error(
          "Enter campaign content first."
        );

        return false;
      }

      return true;
    };


  // ==========================================================
  // START / STOP VOICE INPUT
  // ==========================================================

  const toggleVoiceInput =
    () => {
      if (!voiceSupported) {
        toast.error(
          voiceSupportMessage
        );

        return;
      }

      const recognition =
        recognitionRef.current;

      if (!recognition) {
        toast.error(
          "Voice recognition is unavailable. Please refresh the page and try again."
        );

        return;
      }


      // ========================================================
      // STOP
      // ========================================================

      if (isListening) {
        try {
          recognition.stop();
        } catch (error) {
          console.error(
            "STOP VOICE ERROR:",
            error
          );
        }

        setIsListening(false);

        return;
      }


      // ========================================================
      // START
      // ========================================================

      try {
        recognition.lang =
          voiceLanguage;

        setVoiceError("");

        recognition.start();
      } catch (error) {
        console.error(
          "START VOICE ERROR:",
          error
        );

        if (
          error?.name !==
          "InvalidStateError"
        ) {
          const message =
            "Unable to start voice input. Please try again.";

          setVoiceError(
            message
          );

          toast.error(
            message
          );
        }
      }
    };


  // ==========================================================
  // GENERATE CONTENT
  // ==========================================================

  const generate =
    async () => {
      if (
        !form.content.trim()
      ) {
        toast.error(
          "Enter the campaign brief in the Campaign Content field first."
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await aiService.generateContent(
            {
              brief:
                form.content,

              campaign_type:
                form.campaign_type,

              audience:
                form.ai_audience,

              tone:
                form.tone,
            }
          );

        update(
          "content",
          response.content || ""
        );

        toast.success(
          "Campaign content generated."
        );
      } catch (error) {
        console.error(
          "AI GENERATE ERROR:",
          error
        );

        toast.error(
          getError(
            error,
            "AI generation failed."
          )
        );
      } finally {
        setLoading(false);
      }
    };


  // ==========================================================
  // PERSONALIZATION FIELD TOGGLE
  // ==========================================================

  const togglePersonalizationField =
    (field) => {
      setPersonalizationFields(
        (previous) => {
          if (
            previous.includes(
              field
            )
          ) {
            return previous.filter(
              (item) =>
                item !== field
            );
          }

          return [
            ...previous,
            field,
          ];
        }
      );
    };


  // ==========================================================
  // PERSONALIZE
  // ==========================================================

  const personalize =
    async () => {
      if (!requireContent()) {
        return;
      }

      if (
        personalizationFields.length ===
        0
      ) {
        toast.error(
          "Select at least one personalization field."
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await aiService.personalize(
            {
              content:
                form.content,

              audience:
                form.ai_audience,

              tone:
                form.tone,

              personalization_fields:
                personalizationFields,
            }
          );

        // Never erase the user's original message when
        // personalization does not return usable content.
        const personalizedContent =
          typeof response?.content === "string"
            ? response.content.trim()
            : "";

        if (!personalizedContent) {
          toast.error(
            "AI did not return personalized content. Your original message was preserved."
          );
          return;
        }

        update(
          "content",
          personalizedContent
        );

        toast.success(
          "Personalized campaign content generated successfully."
        );
      } catch (error) {
        console.error(
          "AI PERSONALIZATION ERROR:",
          error
        );

        toast.error(
          getError(
            error,
            "Personalization failed."
          )
        );
      } finally {
        setLoading(false);
      }
    };


  // ==========================================================
  // TONE CHECK
  // ==========================================================

  const toneCheck =
    async () => {
      if (!requireContent()) {
        return;
      }

      try {
        setLoading(true);

        const response =
          await aiService.toneCheck(
            {
              content:
                form.content,
            }
          );

        setToneResult(
          response.analysis || ""
        );

        toast.success(
          "Tone analysis completed."
        );
      } catch (error) {
        console.error(
          "AI TONE ERROR:",
          error
        );

        toast.error(
          getError(
            error,
            "Tone analysis failed."
          )
        );
      } finally {
        setLoading(false);
      }
    };


  // ==========================================================
  // POLICY CHECK
  // ==========================================================

  const policyCheck =
    async () => {
      if (!requireContent()) {
        return;
      }

      try {
        setLoading(true);

        const response =
          await aiService.complianceCheck(
            {
              content:
                form.content,
            }
          );

        setPolicyResult(
          response.analysis || ""
        );

        toast.success(
          "Policy check completed."
        );
      } catch (error) {
        console.error(
          "AI POLICY ERROR:",
          error
        );

        toast.error(
          getError(
            error,
            "Policy check failed."
          )
        );
      } finally {
        setLoading(false);
      }
    };


  // ==========================================================
  // TRANSLATE
  // ==========================================================

  const translate =
    async () => {
      if (!requireContent()) {
        return;
      }

      try {
        setLoading(true);

        const response =
          await aiService.translate(
            {
              content:
                form.content,

              target_language:
                translationLanguage,
            }
          );

        setTranslatedContent(
          response.content || ""
        );

        toast.success(
          `${translationLanguage} translation completed.`
        );
      } catch (error) {
        console.error(
          "AI TRANSLATION ERROR:",
          error
        );

        toast.error(
          getError(
            error,
            "Translation failed."
          )
        );
      } finally {
        setLoading(false);
      }
    };


  // ==========================================================
  // COPY TRANSLATION
  // ==========================================================

  const copyTranslation =
    async () => {
      if (
        !translatedContent
      ) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          translatedContent
        );

        toast.success(
          "Translation copied."
        );
      } catch {
        toast.error(
          "Unable to copy translation."
        );
      }
    };


  // ==========================================================
  // USE TRANSLATION
  // ==========================================================

  const useTranslation =
    () => {
      if (
        !translatedContent
      ) {
        toast.error(
          "Translate the content first."
        );

        return;
      }

      update(
        "content",
        translatedContent
      );

      toast.success(
        "Translation applied to campaign content."
      );
    };


  // ==========================================================
  // SAVE CAMPAIGN
  // ==========================================================

  const saveCampaign =
    async (status) => {
      if (
        !form.campaign_name.trim() ||
        !form.subject.trim() ||
        !form.content.trim()
      ) {
        toast.error(
          "Campaign name, subject and content are required."
        );

        return;
      }

      if (!form.audience_id) {
        toast.error(
          "Select a target audience."
        );

        return;
      }

      try {
        setLoading(true);

        await api.post(
          "/campaign/",
          {
            campaign_name:
              form.campaign_name,

            subject:
              form.subject,

            content:
              form.content,

            audience_id:
              Number(
                form.audience_id
              ),

            schedule_time:
              form.schedule_time ||
              null,

            status,
          }
        );

        toast.success(
          status === "Draft"
            ? "Campaign saved as draft."
            : "Campaign submitted for review."
        );

        navigate(
          "/campaign"
        );
      } catch (error) {
        console.error(
          "CAMPAIGN SAVE ERROR:",
          error
        );

        toast.error(
          getError(
            error,
            "Unable to save campaign."
          )
        );
      } finally {
        setLoading(false);
      }
    };


  // ==========================================================
  // RENDER GENERATE
  // ==========================================================

  const renderGenerateTab =
    () => {
      return (
        <>
          <label className="ai-field-label">
            Campaign Brief / Topic
          </label>

          <textarea
            className="ai-textarea ai-brief"
            value={form.content}
            onChange={(event) =>
              update(
                "content",
                event.target.value
              )
            }
            placeholder="Describe what the public awareness campaign should communicate..."
          />

          <button
            className="ai-main-button"
            onClick={generate}
            disabled={loading}
            type="button"
          >
            <WandSparkles
              size={17}
            />

            {loading
              ? "Generating..."
              : "Generate Campaign Content"}
          </button>

          <div className="ai-info-card">

            <strong>
              AI Suggestion Engine
            </strong>

            <span>
              Generate clear,
              structured
              public-awareness
              announcements
              tailored to the
              selected audience
              and tone.
            </span>

          </div>
        </>
      );
    };


  // ==========================================================
  // RENDER PERSONALIZE
  // ==========================================================

  const renderPersonalizeTab =
    () => {
      return (
        <>
          <div className="ai-personalization-heading">

            <strong>
              Personalization Fields
            </strong>

            <span>
              Select the recipient
              fields AI may use in
              the campaign.
            </span>

          </div>

          <div className="ai-personalization-fields">

            {PERSONALIZATION_FIELDS.map(
              (field) => {
                const selected =
                  personalizationFields.includes(
                    field.value
                  );

                return (
                  <button
                    key={
                      field.value
                    }
                    type="button"
                    className={
                      selected
                        ? "ai-personalization-chip selected"
                        : "ai-personalization-chip"
                    }
                    onClick={() =>
                      togglePersonalizationField(
                        field.value
                      )
                    }
                  >

                    {selected ? (
                      <Check
                        size={13}
                      />
                    ) : (
                      <span className="ai-chip-empty" />
                    )}

                    <span>
                      {field.label}
                    </span>

                    <code>
                      {
                        field.placeholder
                      }
                    </code>

                  </button>
                );
              }
            )}

          </div>

          <button
            className="ai-main-button"
            onClick={
              personalize
            }
            disabled={loading}
            type="button"
          >

            <UserRound
              size={17}
            />

            {loading
              ? "Personalizing..."
              : "Generate Personalized Campaign"}

          </button>

          <p className="ai-helper">
            AI preserves the original
            campaign facts while adapting
            the message to the selected
            audience and using only the
            personalization fields you select.
          </p>

          <div className="ai-info-card">

            <strong>
              Example
            </strong>

            <span>
              Hello {"{{first_name}}"}, we
              are pleased to invite you
              to the awareness program in
              {" {{city}}"}.
            </span>

          </div>
        </>
      );
    };


  // ==========================================================
  // RENDER TONE
  // ==========================================================

  const renderToneTab =
    () => {
      return (
        <>
          <button
            className="ai-main-button"
            onClick={
              toneCheck
            }
            disabled={loading}
            type="button"
          >

            <Target
              size={17}
            />

            {loading
              ? "Analyzing..."
              : "Analyze Tone & Sentiment"}

          </button>

          <p className="ai-helper">
            Review sentiment,
            communication tone,
            tone score, issues
            and improvement
            suggestions.
          </p>

          {toneResult && (
            <pre className="ai-result">
              {toneResult}
            </pre>
          )}

        </>
      );
    };


  // ==========================================================
  // RENDER POLICY
  // ==========================================================

  const renderPolicyTab =
    () => {
      return (
        <>
          <button
            className="ai-main-button"
            onClick={
              policyCheck
            }
            disabled={loading}
            type="button"
          >

            <ShieldCheck
              size={17}
            />

            {loading
              ? "Checking..."
              : "Run Policy & Compliance Check"}

          </button>

          <p className="ai-helper">
            Check campaign content
            for communication safety
            and compliance issues
            before submitting it for review.
          </p>

          {policyResult && (
            <pre className="ai-result">
              {policyResult}
            </pre>
          )}

        </>
      );
    };


  // ==========================================================
  // RENDER TRANSLATE
  // ==========================================================

  const renderTranslateTab =
    () => {
      const selectedLanguage =
        LANGUAGES.find(
          ([value]) =>
            value ===
            translationLanguage
        )?.[1];

      return (
        <>
          <div className="ai-language-row">

            {LANGUAGES.map(
              ([
                value,
                label,
              ]) => (
                <button
                  key={value}
                  type="button"
                  className={
                    translationLanguage ===
                    value
                      ? "ai-language active"
                      : "ai-language"
                  }
                  onClick={() =>
                    setTranslationLanguage(
                      value
                    )
                  }
                >
                  {label}
                </button>
              )
            )}

          </div>

          <button
            className="ai-main-button"
            onClick={
              translate
            }
            disabled={loading}
            type="button"
          >

            <Globe2
              size={17}
            />

            {loading
              ? "Translating..."
              : `Translate into ${selectedLanguage}`}

          </button>

          {translatedContent && (
            <div className="translation-card">

              <div className="translation-header">

                <strong>
                  {selectedLanguage}{" "}
                  Translation
                </strong>

                <div>

                  <button
                    type="button"
                    onClick={
                      copyTranslation
                    }
                  >
                    <Clipboard
                      size={14}
                    />

                    Copy
                  </button>

                  <button
                    type="button"
                    onClick={
                      useTranslation
                    }
                  >
                    <Check
                      size={14}
                    />

                    Use Translation
                  </button>

                </div>

              </div>

              <div className="translation-text">
                {translatedContent}
              </div>

            </div>
          )}

        </>
      );
    };


  // ==========================================================
  // RENDER ACTIVE TAB
  // ==========================================================

  const renderTab =
    () => {
      if (
        activeTab ===
        "generate"
      ) {
        return renderGenerateTab();
      }

      if (
        activeTab ===
        "personalize"
      ) {
        return renderPersonalizeTab();
      }

      if (
        activeTab ===
        "tone"
      ) {
        return renderToneTab();
      }

      if (
        activeTab ===
        "policy"
      ) {
        return renderPolicyTab();
      }

      return renderTranslateTab();
    };


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="ai-studio-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <section className="ai-studio-header">

        <div>

          <div className="ai-eyebrow">

            <Sparkles
              size={13}
            />

            SMARTNOTIFY AI ENGINE

          </div>

          <h1>
            AI Campaign Creation
            Studio
          </h1>

          <p>
            Generate, personalize,
            audit tone & compliance,
            and translate public
            announcements in seconds.
          </p>

        </div>

        <div className="ai-header-actions">

          <button
            className="ai-save-button"
            onClick={() =>
              saveCampaign(
                "Draft"
              )
            }
            disabled={loading}
            type="button"
          >

            <Save
              size={16}
            />

            Save Draft

          </button>

          <button
            className="ai-review-button"
            onClick={() =>
              saveCampaign(
                "Pending Review"
              )
            }
            disabled={loading}
            type="button"
          >

            <ArrowRight
              size={16}
            />

            Submit for Review

          </button>

        </div>

      </section>


      {/* ======================================================
          MAIN GRID
      ====================================================== */}

      <div className="ai-studio-grid">

        {/* ====================================================
            CAMPAIGN DETAILS
        ==================================================== */}

        <section className="ai-form-card">

          <div className="ai-section-title">

            <Megaphone
              size={18}
            />

            <div>

              <h2>
                Campaign Details
              </h2>

              <p>
                Build the campaign
                brief that AI will
                transform into a
                public message.
              </p>

            </div>

          </div>


          {/* ==================================================
              CAMPAIGN TITLE
          ================================================== */}

          <label className="ai-field-label">
            Campaign Title
          </label>

          <input
            className="ai-input"
            value={
              form.campaign_name
            }
            onChange={(
              event
            ) =>
              update(
                "campaign_name",
                event.target.value
              )
            }
            placeholder="Campaign title..."
          />


          {/* ==================================================
              AUDIENCE + CATEGORY
          ================================================== */}

          <div className="ai-two-column">

            <div>

              <label className="ai-field-label">
                Target Audience Segment
              </label>

              <select
                className="ai-input"
                value={
                  form.audience_id
                }
                onChange={(
                  event
                ) => {
                  update(
                    "audience_id",
                    event.target.value
                  );

                  const selected =
                    audiences.find(
                      (item) =>
                        String(
                          item.id
                        ) ===
                        String(
                          event
                            .target
                            .value
                        )
                    );

                  if (
                    selected?.name
                  ) {
                    update(
                      "ai_audience",
                      selected.name
                    );
                  }
                }}
              >

                <option value="">
                  Select audience
                </option>

                {audiences.map(
                  (
                    audience
                  ) => (
                    <option
                      key={
                        audience.id
                      }
                      value={
                        audience.id
                      }
                    >
                      {audience.name ||
                        audience.audience_name ||
                        `Audience #${audience.id}`}
                    </option>
                  )
                )}

              </select>

            </div>


            <div>

              <label className="ai-field-label">
                Campaign Category
              </label>

              <select
                className="ai-input"
                value={
                  form.campaign_type
                }
                onChange={(
                  event
                ) =>
                  update(
                    "campaign_type",
                    event.target.value
                  )
                }
              >

                <option value="announcement">
                  Announcement
                </option>

                <option value="awareness">
                  Awareness
                </option>

                <option value="alert">
                  Alert
                </option>

                <option value="notification">
                  Notification
                </option>

                <option value="educational">
                  Educational
                </option>

                <option value="invitation">
                  Invitation
                </option>

              </select>

            </div>

          </div>


          {/* ==================================================
              SUBJECT
          ================================================== */}

          <label className="ai-field-label">
            Message Subject Line
          </label>

          <input
            className="ai-input"
            value={
              form.subject
            }
            onChange={(
              event
            ) =>
              update(
                "subject",
                event.target.value
              )
            }
            placeholder="Primary headline visible to recipients..."
          />


          {/* ==================================================
              CONTENT BODY
          ================================================== */}

          <label className="ai-field-label">
            Campaign Content Body
          </label>


          {/* ==================================================
              VOICE ENABLED CONTENT AREA
          ================================================== */}

          <div className="ai-voice-content-wrapper">

            <textarea
              className="ai-textarea ai-content ai-voice-textarea"
              value={
                form.content
              }
              onChange={(
                event
              ) =>
                update(
                  "content",
                  event.target.value
                )
              }
              placeholder="Enter a brief for AI, type your campaign content, or use the microphone to speak..."
            />


            {/* =================================================
                VOICE CONTROLS
            ================================================= */}

            <div className="ai-voice-controls">

              {/* VOICE LANGUAGE */}

              <select
                className="ai-voice-language"
                value={
                  voiceLanguage
                }
                onChange={(
                  event
                ) => {
                  if (
                    isListening &&
                    recognitionRef.current
                  ) {
                    try {
                      recognitionRef.current.stop();
                    } catch {
                      // Recognition already stopped.
                    }

                    setIsListening(
                      false
                    );
                  }

                  setVoiceLanguage(
                    event.target.value
                  );

                  setVoiceError(
                    ""
                  );
                }}
                disabled={
                  isListening
                }
                aria-label="Voice input language"
              >

                {VOICE_LANGUAGES.map(
                  ([
                    value,
                    label,
                  ]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  )
                )}

              </select>


              {/* MICROPHONE */}

              <button
                type="button"
                className={
                  isListening
                    ? "ai-voice-button listening"
                    : "ai-voice-button"
                }
                onClick={
                  toggleVoiceInput
                }
                disabled={
                  !voiceSupported ||
                  loading
                }
                title={
                  !voiceSupported
                    ? "Voice input is not supported in this browser"
                    : isListening
                    ? "Stop voice input"
                    : "Start voice input"
                }
                aria-label={
                  isListening
                    ? "Stop voice input"
                    : "Start voice input"
                }
              >

                {isListening ? (
                  <MicOff
                    size={18}
                  />
                ) : (
                  <Mic
                    size={18}
                  />
                )}

                <span>
                  {isListening
                    ? "Listening..."
                    : "Voice Input"}
                </span>

              </button>

            </div>

          </div>


          {/* ==================================================
              VOICE STATUS
          ================================================== */}

          {isListening && (
            <div className="ai-voice-status">

              <span className="ai-voice-pulse" />

              <span>
                Listening in{" "}
                {
                  VOICE_LANGUAGES.find(
                    ([
                      value,
                    ]) =>
                      value ===
                      voiceLanguage
                  )?.[1]
                }
                ... Speak clearly and
                your words will be added
                to the campaign content.
              </span>

            </div>
          )}


          {/* ==================================================
              VOICE ERROR
          ================================================== */}

          {voiceError && (
            <div className="ai-voice-error">

              <MicOff
                size={15}
              />

              <span>
                {voiceError}
              </span>

            </div>
          )}


          {/* ==================================================
              CHARACTER COUNTER
          ================================================== */}

          <div className="ai-counter">

            {form.content.length}
            {" "}characters •{" "}

            {form.content.trim()
              ? form.content
                  .trim()
                  .split(/\s+/)
                  .length
              : 0}

            {" "}words

          </div>


          {/* ==================================================
              SCHEDULE + TONE
          ================================================== */}

          <div className="ai-two-column">

            <div>

              <label className="ai-field-label">
                Scheduled Date & Time
              </label>

              <input
                type="datetime-local"
                className="ai-input"
                value={
                  form.schedule_time
                }
                onChange={(
                  event
                ) =>
                  update(
                    "schedule_time",
                    event.target.value
                  )
                }
              />

            </div>


            <div>

              <label className="ai-field-label">
                AI Tone
              </label>

              <select
                className="ai-input"
                value={
                  form.tone
                }
                onChange={(
                  event
                ) =>
                  update(
                    "tone",
                    event.target.value
                  )
                }
              >

                <option value="professional">
                  Professional
                </option>

                <option value="informative">
                  Informative
                </option>

                <option value="friendly">
                  Friendly
                </option>

                <option value="urgent">
                  Urgent
                </option>

                <option value="reassuring">
                  Reassuring
                </option>

                <option value="empathetic">
                  Empathetic
                </option>

                <option value="simple">
                  Simple
                </option>

              </select>

            </div>

          </div>


          {/* ==================================================
              DELIVERY NOTE
          ================================================== */}

          <div className="ai-delivery-note">

            <FileText
              size={18}
            />

            <div>

              <strong>
                Delivery is handled
                after campaign approval
              </strong>

              <span>
                Save or submit this
                campaign here. Choose
                Email, SMS, WhatsApp
                or other delivery
                channels from the
                Campaigns page when
                you are ready to send.
              </span>

            </div>

          </div>

        </section>


        {/* ====================================================
            AI ASSISTANT
        ==================================================== */}

        <aside className="ai-assistant-card">

          <div className="ai-assistant-header">

            <Sparkles
              size={17}
            />

            <strong>
              AI ASSISTANT
            </strong>

          </div>


          {/* ==================================================
              TABS
          ================================================== */}

          <div className="ai-tabs">

            {TABS.map(
              ({
                id,
                label,
                icon: Icon,
              }) => (
                <button
                  key={id}
                  type="button"
                  className={
                    activeTab ===
                    id
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveTab(
                      id
                    )
                  }
                >

                  <Icon
                    size={14}
                  />

                  {label}

                </button>
              )
            )}

          </div>


          {/* ==================================================
              TAB CONTENT
          ================================================== */}

          <div className="ai-assistant-body">

            {renderTab()}

          </div>

        </aside>

      </div>


      {/* ======================================================
          SELECTED AUDIENCE
      ====================================================== */}

      {selectedAudience && (
        <div className="ai-selected-note">

          <FileText
            size={15}
          />

          Targeting

          <strong>
            {selectedAudience.name ||
              selectedAudience.audience_name}
          </strong>

        </div>
      )}

    </div>
  );
}