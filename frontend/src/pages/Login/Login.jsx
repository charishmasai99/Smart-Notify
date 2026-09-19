import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Globe2,
  Lock,
  Mail,
  Megaphone,
  MessageSquareText,
  Mic,
  RadioTower,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    login,
    register,
    googleLogin,
    loading,
  } = useAuth();

  // ============================================================
  // ROLE CONFIGURATION
  // ============================================================

  const ROLE_OPTIONS = [
    {
      value: "Campaign Manager",
      label: "Campaign Manager",
      shortLabel: "Campaign Manager",
      description: "Campaign Planning & AI Studio",
    },
    {
      value: "Admin",
      label: "Administrator",
      shortLabel: "Administrator",
      description: "Full Governance & RBAC",
    },
    {
      value: "Communication Team",
      label: "Comm Team",
      shortLabel: "Comm Team",
      description: "Communication & Delivery",
    },
  ];

  const ROLE_EMAIL_HINTS = {
    Admin: "admin@gmail.com",
    "Campaign Manager": "manager@smartnotify.com",
    "Communication Team":
      "communication@smartnotify.com",
  };

  const SIGNUP_ROLE = "Campaign Manager";

  const queryRole = new URLSearchParams(
    location.search
  ).get("role");

  const initialRole = ROLE_OPTIONS.some(
    (item) => item.value === queryRole
  )
    ? queryRole
    : "Admin";

  // ============================================================
  // STATE
  // ============================================================

  // Landing page is the first screen.
  const [view, setView] = useState("landing");

  // Sign In is the first authentication tab.
  const [authMode, setAuthMode] =
    useState("signin");

  const [role, setRole] =
    useState(initialRole);

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  // ============================================================
  // LANDING PAGE INTERACTIVE PANELS
  // ============================================================

  const [landingPanel, setLandingPanel] =
    useState(null);

  const [demoTopic, setDemoTopic] =
    useState("Dengue prevention and public health awareness");

  const [demoAudience, setDemoAudience] =
    useState("Urban & Rural Citizens");

  const [demoLanguage, setDemoLanguage] =
    useState("English");

  const [demoGenerated, setDemoGenerated] =
    useState(false);

  const [demoChannels, setDemoChannels] =
    useState(["WhatsApp", "SMS", "Email"]);

  const demoTranslations = {
    English:
      "Dengue prevention starts with simple daily action. Remove standing water, keep your surroundings clean, and protect your family from mosquito bites. Stay alert and share this public health advisory.",
    Telugu:
      "డెంగ్యూ నివారణ ప్రతి రోజు తీసుకునే చిన్న జాగ్రత్తలతో ప్రారంభమవుతుంది. నిల్వ నీటిని తొలగించండి, పరిసరాలను పరిశుభ్రంగా ఉంచండి మరియు దోమ కాట్ల నుండి మీ కుటుంబాన్ని రక్షించండి.",
    Hindi:
      "डेंगू की रोकथाम रोज़ाना की छोटी-छोटी सावधानियों से शुरू होती है। जमा पानी हटाएँ, आसपास सफाई रखें और अपने परिवार को मच्छरों के काटने से बचाएँ।",
    Tamil:
      "டெங்கு தடுப்பு தினசரி எளிய முன்னெச்சரிக்கைகளில் தொடங்குகிறது. தேங்கிய நீரை அகற்றி, சுற்றுப்புறத்தை சுத்தமாக வைத்திருந்து, கொசுக்கடியிலிருந்து குடும்பத்தை பாதுகாக்கவும்.",
    Kannada:
      "ಡೆಂಗ್ಯೂ ತಡೆಗಟ್ಟುವಿಕೆ ಸರಳವಾದ ದೈನಂದಿನ ಮುನ್ನೆಚ್ಚರಿಕೆಗಳಿಂದ ಆರಂಭವಾಗುತ್ತದೆ. ನಿಂತ ನೀರನ್ನು ತೆರವುಗೊಳಿಸಿ, ಸುತ್ತಮುತ್ತಲನ್ನು ಸ್ವಚ್ಛವಾಗಿರಿಸಿ ಮತ್ತು ಸೊಳ್ಳೆ ಕಡಿತದಿಂದ ಕುಟುಂಬವನ್ನು ರಕ್ಷಿಸಿ.",
  };

  const openLandingPanel = (panel) => {
    setLandingPanel(panel);
    setDemoGenerated(false);
  };

  const closeLandingPanel = () => {
    setLandingPanel(null);
    setDemoGenerated(false);
  };

  const runLiveDemo = () => {
    if (!demoTopic.trim()) {
      setDemoTopic("Dengue prevention and public health awareness");
    }

    setDemoGenerated(true);
  };

  const toggleDemoChannel = (channel) => {
    setDemoChannels((previous) =>
      previous.includes(channel)
        ? previous.filter((item) => item !== channel)
        : [...previous, channel]
    );
  };

  // ============================================================
  // DERIVED VALUES
  // ============================================================

  
  // ============================================================
  // VIEW / AUTH MODE
  // ============================================================

  const openSignIn = () => {
    setView("auth");
    setAuthMode("signin");
    setError("");
    setShowPassword(false);

    setName("");
    setPassword("");
    setConfirmPassword("");

    if (!email) {
      setEmail(
        ROLE_EMAIL_HINTS[role] || ""
      );
    }
  };

  const switchToSignIn = () => {
    setView("auth");
    setAuthMode("signin");
    setError("");
    setShowPassword(false);

    setName("");
    setPassword("");
    setConfirmPassword("");

    if (!email) {
      setEmail(
        ROLE_EMAIL_HINTS[role] || ""
      );
    }
  };

  const switchToCreateAccount = () => {
    setView("auth");
    setAuthMode("signup");
    setError("");
    setShowPassword(false);

    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const returnToLanding = () => {
    setView("landing");
    setError("");
    setShowPassword(false);
  };

  // ============================================================
  // ROLE SELECTION
  // ============================================================

  const handleRoleSelect = (nextRole) => {
    setRole(nextRole);
    setError("");

    const demoEmails =
      Object.values(ROLE_EMAIL_HINTS);

    // Only update the convenience email
    // if the current email is empty or another
    // demo account email.
    if (
      !email ||
      demoEmails.includes(email)
    ) {
      setEmail(
        ROLE_EMAIL_HINTS[nextRole] || ""
      );
    }
  };

  // ============================================================
  // GOOGLE AUTH
  // ============================================================

  const handleGoogleAuth = async (mode) => {
    setError("");

    const selectedRole =
      mode === "signup"
        ? SIGNUP_ROLE
        : role;

    try {
      const success =
        await googleLogin(
          selectedRole,
          mode
        );

      if (success) {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(
        "Google authentication error:",
        err
      );

      const status =
        err?.response?.status;

      const detail =
        err?.response?.data?.detail;

      if (status === 403) {
        setError(
          detail ||
            "This Google account does not have access to the selected workspace role."
        );
      } else if (status === 404) {
        setError(
          detail ||
            "No SmartNotify account exists for this Google email. Create an account first."
        );
      } else if (status === 409) {
        setError(
          detail ||
            "An account already exists for this Google email."
        );
      } else if (status === 401) {
        setError(
          detail ||
            "Google identity verification failed."
        );
      } else {
        setError(
          detail ||
            "Google authentication failed. Please try again."
        );
      }
    }
  };

  // ============================================================
  // REGISTER
  // ============================================================

  const handleRegister =
    async (event) => {
      event.preventDefault();
      setError("");

      if (
        !name.trim() ||
        !email.trim() ||
        !password ||
        !confirmPassword
      ) {
        setError(
          "Please complete all registration fields."
        );
        return;
      }

      if (password.length < 8) {
        setError(
          "Password must contain at least 8 characters."
        );
        return;
      }

      if (
        password !== confirmPassword
      ) {
        setError(
          "Passwords do not match."
        );
        return;
      }

      try {
        const success =
          await register(
            name.trim(),
            email
              .trim()
              .toLowerCase(),
            password,
            SIGNUP_ROLE
          );

        if (success) {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error(
          "Registration error:",
          err
        );

        setError(
          err?.response?.data
            ?.detail ||
            "Unable to create your account. Please try again."
        );
      }
    };

  // ============================================================
  // LOGIN
  // ============================================================

  const handleLogin =
    async (event) => {
      event.preventDefault();
      setError("");

      if (!email || !password) {
        setError(
          "Please enter your email and password."
        );
        return;
      }

      try {
        const success =
          await login(
            email,
            password,
            role
          );

        if (success) {
          navigate("/dashboard");
        } else {
          setError(
            "Login failed. Check your email and password."
          );
        }
      } catch (err) {
        console.error(
          "Login error:",
          err
        );

        setError(
          err?.response?.data
            ?.detail ||
            "Unable to login. Please try again."
        );
      }
    };

  // ============================================================
  // LANDING PAGE
  // ============================================================

  if (view === "landing") {
    const demoMessage =
      demoTranslations[demoLanguage] ||
      demoTranslations.English;

    const demoChannelIcons = {
      WhatsApp: MessageSquareText,
      SMS: MessageSquareText,
      Email: Send,
      Push: Bell,
      "Web Broadcast": Globe2,
    };

    const platformItems = [
      {
        icon: Sparkles,
        title: "AI Campaign Studio",
        text: "Create structured public-awareness messages with AI assistance and voice input.",
      },
      {
        icon: Globe2,
        title: "Multilingual Engine",
        text: "Prepare citizen communication across 8 supported Indian languages.",
      },
      {
        icon: RadioTower,
        title: "Multi-Channel Delivery",
        text: "Coordinate Email, SMS, WhatsApp, Push Notification and Web Broadcast workflows.",
      },
      {
        icon: BarChart3,
        title: "Delivery & Analytics",
        text: "Track delivery, engagement, feedback and campaign performance from one workspace.",
      },
    ];

    const featureItems = [
      "AI content generation",
      "Voice-enabled campaign input",
      "8 Indian languages",
      "Audience segmentation",
      "Personalization fields",
      "Tone & sentiment analysis",
      "Policy & compliance checks",
      "Campaign approval workflow",
      "5 delivery channels",
      "Delivery tracking & retries",
      "Engagement & feedback",
      "Reports and analytics",
    ];

    const renderLandingModal = () => {
      if (!landingPanel) {
        return null;
      }

      const modalTitle =
        landingPanel === "platform"
          ? "SmartNotify Platform"
          : landingPanel === "features"
          ? "Platform Capabilities"
          : landingPanel === "about"
          ? "About SmartNotify"
          : "Live Product Demo";

      const modalSubtitle =
        landingPanel === "platform"
          ? "A unified civic communication workflow from campaign creation to measurable delivery."
          : landingPanel === "features"
          ? "Everything in SmartNotify is designed around one operational flow: create, verify, deliver and measure."
          : landingPanel === "about"
          ? "AI-powered multilingual communication infrastructure for public-service organizations and citizen outreach."
          : "Explore the campaign workflow without creating an account. This demo does not send real messages.";

      return (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617]/80 p-4 backdrop-blur-md sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={modalTitle}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeLandingPanel();
            }
          }}
        >
          <div className="relative max-h-[90vh] w-full max-w-[1050px] overflow-hidden rounded-[26px] border border-blue-400/20 bg-[#071225] shadow-2xl shadow-black/60">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

            <div className="flex items-start justify-between border-b border-slate-800/80 px-5 py-5 sm:px-7">
              <div>
                <div className="mb-2 flex items-center gap-2 text-[9px] font-mono font-bold tracking-[0.2em] text-blue-400">
                  <Sparkles size={13} />
                  SMARTNOTIFY // {landingPanel.toUpperCase()}
                </div>
                <h3 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                  {modalTitle}
                </h3>
                <p className="mt-1 max-w-[700px] text-[11px] leading-5 text-slate-400 sm:text-xs">
                  {modalSubtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={closeLandingPanel}
                className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/70 text-slate-400 transition hover:border-blue-500/60 hover:text-white"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            {landingPanel === "platform" && (
              <div className="overflow-y-auto p-5 sm:p-7">
                <div className="grid gap-4 sm:grid-cols-2">
                  {platformItems.map(({ icon: Icon, title, text }) => (
                    <div
                      key={title}
                      className="group rounded-2xl border border-slate-800 bg-slate-950/45 p-5 transition hover:border-blue-500/40 hover:bg-blue-500/[0.04]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                          <Icon size={19} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">
                            {title}
                          </h4>
                          <p className="mt-1.5 text-[11px] leading-5 text-slate-400">
                            {text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] p-5">
                  <div className="mb-4 flex items-center gap-2 text-[9px] font-mono font-bold tracking-[0.18em] text-blue-400">
                    <Activity size={14} />
                    UNIFIED WORKFLOW
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-200">
                    {["Audience", "AI Create", "Translate", "Verify", "Approve", "Deliver", "Analyze"].map(
                      (step, index, array) => (
                        <span key={step} className="flex items-center gap-2">
                          <span className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
                            {step}
                          </span>
                          {index < array.length - 1 && (
                            <ChevronRight size={13} className="text-blue-500" />
                          )}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {landingPanel === "features" && (
              <div className="overflow-y-auto p-5 sm:p-7">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {featureItems.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/45 px-4 py-3.5"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                        <Check size={13} />
                      </span>
                      <span className="text-[11px] font-semibold text-slate-200">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="text-xl font-black text-white">8</div>
                    <div className="mt-1 text-[8px] font-mono tracking-widest text-slate-500">INDIC LANGUAGES</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="text-xl font-black text-emerald-400">5</div>
                    <div className="mt-1 text-[8px] font-mono tracking-widest text-slate-500">DELIVERY CHANNELS</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="text-xl font-black text-blue-400">AI</div>
                    <div className="mt-1 text-[8px] font-mono tracking-widest text-slate-500">CONTENT ENGINE</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="text-xl font-black text-indigo-300">24/7</div>
                    <div className="mt-1 text-[8px] font-mono tracking-widest text-slate-500">OPERATIONAL VISIBILITY</div>
                  </div>
                </div>
              </div>
            )}

            {landingPanel === "about" && (
              <div className="overflow-y-auto p-5 sm:p-7">
                <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
                        <span className="text-sm font-black">SN</span>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono font-bold tracking-[0.18em] text-blue-400">SMARTNOTIFY</div>
                        <h4 className="mt-1 text-xl font-black text-white">AI-powered civic communication</h4>
                      </div>
                    </div>

                    <p className="mt-5 text-[12px] leading-6 text-slate-300">
                      SmartNotify helps government agencies, municipal organizations and public-service teams create understandable public-awareness campaigns, reach defined audiences in their preferred language, coordinate multiple delivery channels and measure communication outcomes from one workspace.
                    </p>

                    <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-4">
                      <div className="text-[9px] font-mono font-bold tracking-[0.16em] text-blue-400">DESIGNED AROUND ONE FLOW</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-200">
                        {['Create', 'Translate', 'Verify', 'Approve', 'Deliver', 'Measure'].map((step, index, array) => (
                          <span key={step} className="flex items-center gap-2">
                            <span className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5">{step}</span>
                            {index < array.length - 1 && <ChevronRight size={12} className="text-blue-500" />}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    {[
                      [Sparkles, 'AI-assisted creation', 'Generate and refine public-awareness content with a focused campaign workflow.'],
                      [Globe2, 'Multilingual outreach', 'Support communication across 8 Indian regional languages.'],
                      [RadioTower, 'Unified delivery', 'Coordinate 5 communication channels after campaign approval.'],
                      [BarChart3, 'Operational visibility', 'Track delivery, engagement, feedback and campaign performance.'],
                    ].map(([Icon, title, text]) => (
                      <div key={title} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400">
                            <Icon size={17} />
                          </div>
                          <div>
                            <h5 className="text-[11px] font-black text-white">{title}</h5>
                            <p className="mt-1 text-[9px] leading-4 text-slate-500">{text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {landingPanel === "demo" && (
              <div className="max-h-[calc(90vh-115px)] overflow-y-auto p-4 sm:p-6">
                <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr]">
                  <div className="rounded-2xl border border-slate-800 bg-[#09182e] p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] font-mono font-bold tracking-[0.16em] text-blue-400">AI CAMPAIGN CREATOR</div>
                        <h4 className="mt-1 text-base font-black text-white">Create a public message</h4>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
                        <Mic size={17} />
                      </div>
                    </div>

                    <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Campaign topic
                    </label>
                    <textarea
                      value={demoTopic}
                      onChange={(event) => setDemoTopic(event.target.value)}
                      className="min-h-[92px] w-full resize-none rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-[11px] leading-5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                      placeholder="Describe the public-awareness message..."
                    />

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-slate-400">Audience</label>
                        <select
                          value={demoAudience}
                          onChange={(event) => setDemoAudience(event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-[10px] text-white outline-none focus:border-blue-500"
                        >
                          <option>Urban & Rural Citizens</option>
                          <option>Senior Citizens</option>
                          <option>Students</option>
                          <option>Public Health Workers</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-slate-400">Language</label>
                        <select
                          value={demoLanguage}
                          onChange={(event) => {
                            setDemoLanguage(event.target.value);
                            setDemoGenerated(true);
                          }}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-[10px] text-white outline-none focus:border-blue-500"
                        >
                          <option>English</option>
                          <option>Telugu</option>
                          <option>Hindi</option>
                          <option>Tamil</option>
                          <option>Kannada</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-2 block text-[9px] font-bold uppercase tracking-wider text-slate-400">Delivery preview</label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {Object.keys(demoChannelIcons).map((channel) => {
                          const Icon = demoChannelIcons[channel];
                          const selected = demoChannels.includes(channel);

                          return (
                            <button
                              key={channel}
                              type="button"
                              onClick={() => toggleDemoChannel(channel)}
                              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[9px] font-bold transition ${
                                selected
                                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                  : "border-slate-700 bg-slate-950/40 text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              <Icon size={14} />
                              {channel}
                              {selected && <Check size={12} className="ml-auto" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={runLiveDemo}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-[10px] font-black tracking-wide text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
                    >
                      <Sparkles size={15} />
                      GENERATE DEMO CAMPAIGN
                    </button>

                    <p className="mt-2 text-center text-[8px] text-slate-600">
                      Demo mode only — no real SMS, WhatsApp, Email or Push notification is sent.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-[#06152b] p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] font-mono font-bold tracking-[0.16em] text-emerald-400">LIVE WORKFLOW PREVIEW</div>
                        <h4 className="mt-1 text-base font-black text-white">Campaign output</h4>
                      </div>
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[8px] font-bold text-emerald-300">
                        DEMO MODE
                      </span>
                    </div>

                    {!demoGenerated ? (
                      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-6 text-center">
                        <div>
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                            <Megaphone size={21} />
                          </div>
                          <h5 className="mt-4 text-sm font-black text-white">Ready to generate</h5>
                          <p className="mx-auto mt-1.5 max-w-[300px] text-[10px] leading-5 text-slate-500">
                            Enter a topic, choose an audience and language, then generate a sample campaign.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-blue-500/20 bg-slate-950/50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[8px] font-mono uppercase tracking-widest text-slate-500">{demoLanguage}</span>
                            <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[8px] font-bold text-blue-300">AI GENERATED</span>
                          </div>
                          <h5 className="mt-3 text-sm font-black text-white">{demoTopic}</h5>
                          <p className="mt-2 text-[10px] leading-5 text-slate-300">
                            {demoMessage}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3">
                            <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-300">
                              <Check size={13} /> Tone verified
                            </div>
                          </div>
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3">
                            <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-300">
                              <ShieldCheck size={13} /> Policy checked
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
                          <div className="mb-2 text-[8px] font-mono uppercase tracking-widest text-slate-500">
                            Target audience
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-white">
                            <Users size={14} className="text-blue-400" />
                            {demoAudience}
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
                          <div className="mb-2 text-[8px] font-mono uppercase tracking-widest text-slate-500">
                            Selected channels
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {demoChannels.length ? (
                              demoChannels.map((channel) => (
                                <span key={channel} className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-[8px] font-bold text-emerald-300">
                                  {channel} ✓
                                </span>
                              ))
                            ) : (
                              <span className="text-[9px] text-slate-500">Select at least one channel.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="min-h-screen overflow-hidden bg-[#030817] text-white">
        {/* ======================================================
            PREMIUM LANDING HEADER
        ======================================================= */}
        <header className="relative z-30 border-b border-slate-800/70 bg-[#030817]/90 backdrop-blur-xl">
          <div className="mx-auto max-w-none w-full px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="flex h-[70px] items-center justify-between">
              <button
                type="button"
                onClick={returnToLanding}
                className="flex items-center gap-3 text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/25">
                  <span className="text-sm font-black">SN</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black tracking-tight text-white">
                      SmartNotify
                    </span>
                    <span className="rounded border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-[7px] font-bold tracking-wider text-blue-400">
                      CIVIC
                    </span>
                  </div>
                  <p className="text-[8px] text-slate-500">
                    AI-Powered Civic Communication
                  </p>
                </div>
              </button>

              <nav className="hidden items-center gap-1 md:flex">
                <button
                  type="button"
                  onClick={() => openLandingPanel("platform")}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-[12px] font-semibold text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
                >
                  Platform
                  <ChevronDown size={13} className="text-slate-500" />
                </button>

                <button
                  type="button"
                  onClick={() => openLandingPanel("features")}
                  className="rounded-lg px-4 py-2.5 text-[12px] font-semibold text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
                >
                  Features
                </button>

                <button
                  type="button"
                  onClick={() => openLandingPanel("about")}
                  className="rounded-lg px-4 py-2.5 text-[12px] font-semibold text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
                >
                  About
                </button>

                <button
                  type="button"
                  onClick={openSignIn}
                  className="ml-3 rounded-xl border border-slate-700 bg-slate-900/70 px-5 py-2.5 text-[11px] font-bold text-slate-200 transition hover:border-blue-500/70 hover:bg-blue-500/10 hover:text-white"
                >
                  SIGN IN
                </button>
              </nav>

              <button
                type="button"
                onClick={openSignIn}
                className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-[10px] font-bold text-slate-200 md:hidden"
              >
                SIGN IN
              </button>
            </div>
          </div>
        </header>

        {/* ======================================================
            SINGLE LAYERED HERO
        ======================================================= */}
        <main className="relative min-h-[calc(100vh-70px)] overflow-hidden">
          {/* Background depth */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-15%] top-[15%] h-[600px] w-[600px] rounded-full bg-blue-600/[0.10] blur-[130px]" />
            <div className="absolute right-[-8%] top-[5%] h-[520px] w-[520px] rounded-full bg-indigo-500/[0.12] blur-[120px]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.035)_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
          </div>

          <div className="relative mx-auto flex min-h-[calc(100vh-70px)] max-w-none w-full flex-col items-center justify-center px-5 py-4 sm:px-7 lg:px-10 xl:px-12 lg:py-5">
            <div className="relative grid w-full items-center gap-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] xl:gap-8">
              {/* Hero copy */}
              <section className="relative z-20 w-full max-w-[680px]">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/[0.07] px-3.5 py-2 text-[8px] font-mono font-bold tracking-[0.16em] text-blue-300 sm:text-[9px]">
                  <Sparkles size={12} />
                  AI-POWERED CIVIC COMMUNICATION PLATFORM
                </div>

                <h1 className="max-w-[720px] text-[48px] font-black leading-[0.92] tracking-[-0.055em] text-white sm:text-[62px] lg:text-[72px] xl:text-[78px]">
                  Reach every citizen.
                  <span className="block text-blue-500">
                    In their language.
                  </span>
                  <span className="block">
                    Through every channel.
                  </span>
                </h1>

                <p className="mt-6 max-w-[650px] text-[12px] leading-6 text-slate-300 sm:text-[13px]">
                  Create, translate, personalize and deliver public-awareness campaigns with AI — then track delivery, engagement and audience sentiment from one unified civic communication platform.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={openSignIn}
                    className="group flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-[10px] font-black tracking-wide text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-500"
                  >
                    START A CAMPAIGN
                    <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                  </button>

                  <button
                    type="button"
                    onClick={() => openLandingPanel("demo")}
                    className="group flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-5 py-3.5 text-[10px] font-black tracking-wide text-slate-200 transition hover:-translate-y-0.5 hover:border-blue-500/60 hover:bg-blue-500/[0.06] hover:text-white"
                  >
                    <Sparkles size={14} className="text-blue-400" />
                    TRY LIVE DEMO
                    <ChevronRight size={14} className="text-slate-500 transition group-hover:translate-x-0.5" />
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[8px] font-mono tracking-wide text-slate-500 sm:text-[9px]">
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <Mic size={12} /> Voice input enabled
                  </span>
                  <span>•</span>
                  <span>8 Indic languages</span>
                  <span>•</span>
                  <span>5 live channels</span>
                </div>
              </section>

              {/* Product preview layer */}
              <section className="relative z-10 flex justify-end lg:ml-0">
                <div className="relative w-[92%] max-w-[860px]">
                  <div className="absolute -inset-8 rounded-[50px] bg-blue-500/[0.08] blur-3xl" />

                  <div className="relative w-full overflow-hidden rounded-[24px] border border-blue-300/15 bg-[#071326]/90 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-3">
                    {/* Preview browser bar */}
                    <div className="flex h-10 items-center justify-between rounded-t-[17px] border-b border-slate-800 bg-[#08182d] px-3 sm:px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
                          <span className="text-[8px] font-black">SN</span>
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-white">SmartNotify</div>
                          <div className="text-[6px] text-slate-500">AI Civic Communication & Broadcast Gateway</div>
                        </div>
                      </div>
                      <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[7px] font-bold text-emerald-300">
                        ● LIVE DISPATCH
                      </div>
                    </div>

                    {/* Dashboard preview */}
                    <div className="grid gap-2.5 bg-[#061226] p-3 sm:grid-cols-[1.02fr_0.9fr_0.9fr] sm:p-4">
                      {/* AI creator */}
                      <div className="rounded-xl border border-slate-700/80 bg-[#091b34] p-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[12px] font-black text-white">AI Campaign Creator</h3>
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/80 text-white">
                            <Mic size={13} />
                          </div>
                        </div>

                        <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950/40 p-2.5 text-[8px] leading-4 text-slate-300">
                          Dengue Prevention &amp; Public Health Advisory
                        </div>

                        {["Hindi", "Telugu", "English"].map((language, index) => (
                          <div key={language} className="mt-2 rounded-lg border border-slate-700/80 bg-slate-950/30 p-2">
                            <div className="text-[7px] text-slate-500">{language}</div>
                            <div className="mt-1 text-[8px] leading-3 text-slate-300">
                              {index === 0
                                ? "डेंगू की रोकथाम के लिए सावधान रहें"
                                : index === 1
                                ? "డెంగ్యూ నివారణకు జాగ్రత్తలు తీసుకోండి"
                                : "Dengue Prevention & Public Health Advisory"}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Audience */}
                      <div className="rounded-xl border border-slate-700/80 bg-[#091b34] p-3">
                        <div className="text-[8px] text-slate-500">Target audience cohort</div>
                        <div className="mt-1 text-[17px] font-black leading-5 text-white">
                          Ward 12 &amp; Urban Districts
                        </div>
                        <div className="mt-1 text-[10px] font-bold text-blue-300">10,000 Citizens</div>

                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-2.5 py-2 text-[8px] font-bold text-emerald-300">
                            <span className="flex items-center gap-1.5"><Check size={12} /> Tone Verification</span>
                            <span>✓</span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-2.5 py-2 text-[8px] font-bold text-emerald-300">
                            <span className="flex items-center gap-1.5"><ShieldCheck size={12} /> DLT Compliance</span>
                            <span>✓</span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-blue-500/10 px-2.5 py-2 text-[8px] font-bold text-blue-300">
                            <span className="flex items-center gap-1.5"><Target size={12} /> Audience Match</span>
                            <span>98%</span>
                          </div>
                        </div>
                      </div>

                      {/* Channels */}
                      <div className="rounded-xl border border-slate-700/80 bg-[#091b34] p-3">
                        <div className="text-[9px] font-black text-white">5-channel simultaneous dispatch</div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {[
                            ["WhatsApp", MessageSquareText, "emerald"],
                            ["SMS", MessageSquareText, "emerald"],
                            ["Email", Send, "slate"],
                            ["Push", Bell, "blue"],
                            ["Web", Globe2, "blue"],
                          ].map(([name, Icon, tone]) => (
                            <div key={name} className="rounded-lg border border-slate-700 bg-slate-950/30 p-2 text-center">
                              <div className={`mx-auto flex h-7 w-7 items-center justify-center rounded-lg ${tone === "emerald" ? "bg-emerald-500/15 text-emerald-300" : tone === "blue" ? "bg-blue-500/15 text-blue-300" : "bg-slate-700/50 text-slate-300"}`}>
                                <Icon size={13} />
                              </div>
                              <div className="mt-1 text-[7px] text-slate-400">{name}</div>
                              <div className="text-[6px] text-emerald-400">✓ READY</div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950/40 p-2.5">
                          <div className="flex items-center justify-between text-[7px]">
                            <span className="text-slate-500">Delivery Rate</span>
                            <span className="font-bold text-white">95%</span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                            <div className="h-full w-[95%] rounded-full bg-emerald-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Analytics strip */}
                    <div className="grid grid-cols-3 gap-2 border-t border-slate-800 bg-[#08172c] p-3">
                      <div className="rounded-xl border border-slate-700 bg-slate-950/30 p-2.5">
                        <div className="text-[7px] text-slate-500">DELIVERY RATE</div>
                        <div className="mt-1 text-base font-black text-emerald-400">95%</div>
                      </div>
                      <div className="rounded-xl border border-slate-700 bg-slate-950/30 p-2.5">
                        <div className="text-[7px] text-slate-500">ENGAGEMENT</div>
                        <div className="mt-1 text-base font-black text-blue-400">72%</div>
                      </div>
                      <div className="rounded-xl border border-slate-700 bg-slate-950/30 p-2.5">
                        <div className="text-[7px] text-slate-500">SENTIMENT</div>
                        <div className="mt-1 text-base font-black text-indigo-300">Positive</div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -right-3 -top-3 rounded-xl border border-blue-400/20 bg-[#08182d]/95 px-3 py-2 shadow-xl backdrop-blur-xl sm:-right-5 sm:-top-4">
                    <div className="flex items-center gap-2 text-[8px] font-bold text-blue-300">
                      <ShieldCheck size={13} />
                      DLT REGULATORY VERIFIED
                    </div>
                  </div>

                  <div className="absolute -bottom-4 left-5 rounded-xl border border-emerald-400/20 bg-[#08182d]/95 px-3 py-2 shadow-xl backdrop-blur-xl sm:left-8">
                    <div className="flex items-center gap-2 text-[8px] font-bold text-emerald-300">
                      <Activity size={13} />
                      REAL-TIME DELIVERY TELEMETRY
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Integrated metrics / trust rail */}
            <div className="relative z-20 mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:mt-4">
              <div className="rounded-2xl border border-slate-800/90 bg-[#081327]/80 p-3.5 backdrop-blur-xl sm:p-4">
                <div className="text-base font-black text-white sm:text-lg">145,000+</div>
                <div className="mt-1 text-[7px] font-mono tracking-widest text-slate-500">BROADCASTS</div>
              </div>
              <div className="rounded-2xl border border-slate-800/90 bg-[#081327]/80 p-3.5 backdrop-blur-xl sm:p-4">
                <div className="text-base font-black text-blue-400 sm:text-lg">8 Indic</div>
                <div className="mt-1 text-[7px] font-mono tracking-widest text-slate-500">LANGUAGES</div>
              </div>
              <div className="rounded-2xl border border-slate-800/90 bg-[#081327]/80 p-3.5 backdrop-blur-xl sm:p-4">
                <div className="text-base font-black text-emerald-400 sm:text-lg">5 Channels</div>
                <div className="mt-1 text-[7px] font-mono tracking-widest text-slate-500">GATEWAYS</div>
              </div>
              <div className="rounded-2xl border border-slate-800/90 bg-[#081327]/80 p-3.5 backdrop-blur-xl sm:p-4">
                <div className="text-base font-black text-indigo-300 sm:text-lg">99.98%</div>
                <div className="mt-1 text-[7px] font-mono tracking-widest text-slate-500">RELIABILITY</div>
              </div>
            </div>

            <div className="relative z-20 mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pb-2 text-[7px] font-mono tracking-wide text-slate-600 sm:text-[8px]">
              <span className="text-blue-400">◇ CERT-In Audited</span>
              <span>•</span>
              <span>DLT Telecom Registered</span>
              <span>•</span>
              <span>256-Bit Encrypted</span>
              <span>•</span>
              <span>Role-Based Access</span>
            </div>
          </div>
        </main>

        {renderLandingModal()}
      </div>
    );
  }

  // ============================================================
  // AUTH SCREEN
  // ============================================================

  return (
    <div className="min-h-screen bg-[#050b19] text-white">
      {/* HEADER */}
      <header className="border-b border-slate-800/80">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-600/25">
                <span className="text-sm font-black">
                  SN
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-black">
                    SmartNotify
                  </h1>

                  <span className="rounded border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-[7px] font-bold tracking-wider text-blue-400">
                    ENTERPRISE
                  </span>
                </div>

                <p className="text-[8px] text-slate-500">
                  Multilingual Civic Broadcast Platform
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={returnToLanding}
              className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-[9px] font-semibold text-slate-300 transition hover:border-blue-500 hover:text-white"
            >
              ← Back to Overview
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-64px)] max-w-[1200px] items-center gap-10 px-6 py-8 lg:grid-cols-[1fr_0.96fr]">
        {/* LEFT HERO */}
        <section>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-500/50 bg-blue-500/10 px-4 py-2 text-[8px] font-mono font-bold tracking-widest text-blue-400">
            ✨ NEXT-GEN CIVIC BROADCAST PLATFORM
          </div>

          <h2 className="max-w-[600px] text-5xl font-black leading-[0.92] tracking-[-0.05em] lg:text-[61px]">
            <span className="block">
              AI-POWERED
            </span>

            <span className="block">
              MULTILINGUAL
            </span>

            <span className="block text-blue-500">
              MASS
            </span>

            <span className="block text-blue-100">
              COMMUNICATION
            </span>
          </h2>

          <p className="mt-6 max-w-[560px] text-[13px] leading-6 text-slate-300">
            Empowering government agencies,
            municipal corporations, and public
            health networks to compose,
            safety-verify, translate into 8 Indian
            regional languages, and broadcast
            instantly across 5 high-speed channels.
          </p>

          <div className="mt-7 grid max-w-[510px] grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-[#0a1326] px-4 py-4 text-center">
              <div className="text-xl font-black">
                145,000+
              </div>
              <div className="mt-1 text-[7px] font-mono tracking-widest text-slate-500">
                BROADCASTS
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0a1326] px-4 py-4 text-center">
              <div className="text-xl font-black text-blue-400">
                8 Indic
              </div>
              <div className="mt-1 text-[7px] font-mono tracking-widest text-slate-500">
                LANGUAGES
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0a1326] px-4 py-4 text-center">
              <div className="text-xl font-black text-emerald-400">
                5 Channels
              </div>
              <div className="mt-1 text-[7px] font-mono tracking-widest text-slate-500">
                GATEWAYS
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0a1326] px-4 py-4 text-center">
              <div className="text-xl font-black text-indigo-300">
                99.98%
              </div>
              <div className="mt-1 text-[7px] font-mono tracking-widest text-slate-500">
                RELIABILITY
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-[8px] font-mono tracking-wide text-slate-500">
            <span className="text-blue-400">
              ◇ CERT-In Audited
            </span>
            <span>•</span>
            <span>DLT Telecom Registered</span>
            <span>•</span>
            <span>256-Bit Encrypted</span>
          </div>
        </section>

        {/* RIGHT AUTH CARD */}
        <section className="rounded-[22px] border border-slate-700/80 bg-[#091121] p-5 shadow-2xl shadow-black/30 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[8px] font-mono font-bold tracking-[0.18em] text-blue-400">
                SMARTNOTIFY // PORTAL
              </p>

              <h3 className="mt-2 text-[22px] font-black">
                {authMode === "signin"
                  ? "Secure Sign In"
                  : "Create Workspace Account"}
              </h3>

              <p className="mt-1 text-[9px] text-slate-500">
                {authMode === "signin"
                  ? "Authorized platform access"
                  : "Register a new verified officer identity for regional broadcasting."}
              </p>
            </div>

            <span className="rounded border border-blue-500/50 bg-blue-500/10 px-2 py-1 text-[7px] font-mono font-bold tracking-widest text-blue-400">
              PORTAL AUTH
            </span>
          </div>

          {/* AUTH TABS */}
          <div className="mt-5 grid grid-cols-2 rounded-xl border border-slate-800 bg-slate-950/80 p-1">
            <button
              type="button"
              onClick={
                switchToSignIn
              }
              className={`rounded-lg px-3 py-2.5 text-[10px] font-bold tracking-wide transition ${
                authMode === "signin"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              SIGN IN
            </button>

            <button
              type="button"
              onClick={
                switchToCreateAccount
              }
              className={`rounded-lg px-3 py-2.5 text-[10px] font-bold tracking-wide transition ${
                authMode === "signup"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              CREATE ACCOUNT
            </button>
          </div>

          {/* =====================================================
              THREE-ROLE SWITCH — SIGN IN ONLY
          ====================================================== */}

          {authMode === "signin" && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[8px] font-mono font-bold tracking-[0.15em] text-slate-400">
                  WORKSPACE ROLE
                </label>

                <span className="text-[8px] font-mono font-bold text-blue-400">
                  RBAC VERIFIED
                </span>
              </div>

              <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                {ROLE_OPTIONS.map(
                  (item) => {
                    const isSelected =
                      role === item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() =>
                          handleRoleSelect(
                            item.value
                          )
                        }
                        className={`relative flex min-h-[58px] items-center justify-center gap-2 px-3 py-2 text-center transition ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                        }`}
                      >
                        <ShieldCheck
                          size={16}
                          className={
                            isSelected
                              ? "text-white"
                              : "text-slate-500"
                          }
                        />

                        <span className="min-w-0">
                          <span className="block whitespace-nowrap text-[9px] font-bold">
                            {item.shortLabel}
                          </span>

                          <span
                            className={`mt-0.5 block whitespace-nowrap text-[7px] ${
                              isSelected
                                ? "text-blue-100"
                                : "text-slate-600"
                            }`}
                          >
                            {item.value ===
                            "Admin"
                              ? "Full Governance"
                              : item.value ===
                                "Campaign Manager"
                                ? "Planning & AI"
                                : "Delivery Team"}
                          </span>
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* FORM */}
          <form
            onSubmit={
              authMode === "signin"
                ? handleLogin
                : handleRegister
            }
            className="mt-5 space-y-3.5"
          >
            {authMode ===
              "signup" && (
              <div>
                <label className="mb-1.5 block text-[8px] font-mono font-bold tracking-[0.15em] text-slate-400">
                  OFFICER FULL NAME
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target
                        .value
                    )
                  }
                  placeholder="e.g. Dr. Rajesh Kumar"
                  autoComplete="name"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-[12px] text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[8px] font-mono font-bold tracking-[0.15em] text-slate-400">
                WORK EMAIL
              </label>

              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  size={16}
                />

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target
                        .value
                    )
                  }
                  placeholder={
                    authMode ===
                    "signup"
                      ? "name@smartnotify.gov.in"
                      : ROLE_EMAIL_HINTS[
                          role
                        ] ||
                        "name@smartnotify.gov.in"
                  }
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-3.5 text-[12px] text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                />
              </div>

              {authMode ===
                "signin" && (
                <p className="mt-1.5 text-[8px] font-mono text-slate-600">
                  Role account:{" "}
                  <span className="text-slate-400">
                    {
                      ROLE_EMAIL_HINTS[
                        role
                      ]
                    }
                  </span>
                </p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[8px] font-mono font-bold tracking-[0.15em] text-slate-400">
                  PASSWORD
                </label>

                {authMode ===
                  "signin" && (
                  <button
                    type="button"
                    onClick={() =>
                      setError(
                        "Password reset is currently managed by your SmartNotify administrator."
                      )
                    }
                    className="text-[8px] font-mono text-blue-400 hover:text-blue-300"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  size={16}
                />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target
                        .value
                    )
                  }
                  placeholder={
                    authMode ===
                    "signup"
                      ? "Enter account password"
                      : "Enter your account password"
                  }
                  autoComplete={
                    authMode ===
                    "signup"
                      ? "new-password"
                      : "current-password"
                  }
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-10 text-[12px] text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {authMode ===
              "signup" && (
              <div>
                <label className="mb-1.5 block text-[8px] font-mono font-bold tracking-[0.15em] text-slate-400">
                  CONFIRM PASSWORD
                </label>

                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    size={16}
                  />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      confirmPassword
                    }
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target
                          .value
                      )
                    }
                    placeholder="Confirm account password"
                    autoComplete="new-password"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-3.5 text-[12px] text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-900/60 bg-red-950/35 px-3.5 py-2.5 text-[10px] leading-4 text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-[11px] font-bold tracking-wide text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? authMode ===
                  "signin"
                  ? "SIGNING IN..."
                  : "CREATING ACCOUNT..."
                : authMode ===
                  "signin"
                  ? "SIGN IN SECURELY  →"
                  : "CREATE ACCOUNT & ACCESS  →"}
            </button>
          </form>

          {/* GOOGLE */}

          <div className="mt-4">
            <div className="flex items-center gap-2.5 text-[7px] font-mono tracking-[0.15em] text-slate-600">
              <span className="h-px flex-1 bg-slate-800" />
              <span>
                OR CONTINUE WITH
              </span>
              <span className="h-px flex-1 bg-slate-800" />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                handleGoogleAuth(
                  authMode
                )
              }
              className="mt-3 flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-700 bg-slate-950 py-3 text-[11px] font-semibold text-slate-100 transition hover:border-blue-500 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-[#4285F4]">
                G
              </span>

              {authMode ===
              "signin"
                ? "Continue with Google"
                : "Sign up with Google"}
            </button>
          </div>

          {/* SWITCH */}
          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-2.5 text-center">
            {authMode ===
            "signin" ? (
              <p className="text-[9px] text-slate-500">
                New to SmartNotify?{" "}
                <button
                  type="button"
                  onClick={
                    switchToCreateAccount
                  }
                  className="font-semibold text-blue-400 hover:text-blue-300"
                >
                  Create account
                </button>
              </p>
            ) : (
              <p className="text-[9px] text-slate-500">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={
                    switchToSignIn
                  }
                  className="font-semibold text-blue-400 hover:text-blue-300"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-[7px] text-slate-600">
            <ShieldCheck
              size={14}
              className="text-emerald-400"
            />
            Protected by AES-256 &amp; Gov-Grade Role Permissions
          </div>
        </section>
      </main>
    </div>
  );
}
