import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bell,
  Bot,
  Check,
  ChevronRight,
  Globe,
  KeyRound,
  LayoutDashboard,
  Lock,
  Mail,
  MessageSquare,
  Palette,
  RotateCcw,
  Save,
  Shield,
  Smartphone,
  User,
  UserCircle,
  Webhook,
  X,
  Trash2,
} from "lucide-react";

import settingsService from "../../services/settingsService";

import "./Settings.css";


// ============================================================
// DEFAULT SETTINGS
// ============================================================

const DEFAULT_SETTINGS = {

  notifications: true,

  emailNotifications: true,

  theme: "Light",

  language: "English",

  autoRefresh: true,

  campaignUpdates: true,

  deliveryAlerts: true,

  feedbackNotifications: true,

  systemNotifications: false,

};


// ============================================================
// SETTINGS NAVIGATION
// ============================================================

const SETTINGS_SECTIONS = [

  {
    id: "profile",
    label: "Profile",
    description:
      "Personal information and account details.",
    icon: UserCircle,
  },

  {
    id: "workspace",
    label: "Workspace",
    description:
      "Workspace preferences and defaults.",
    icon: LayoutDashboard,
  },

  {
    id: "security",
    label: "Security",
    description:
      "Password and account security.",
    icon: Shield,
  },

  {
    id: "notifications",
    label: "Notifications",
    description:
      "Choose which alerts you receive.",
    icon: Bell,
  },

  {
    id: "email",
    label: "Email",
    description:
      "Email communication preferences.",
    icon: Mail,
  },

  {
    id: "sms",
    label: "SMS",
    description:
      "SMS communication preferences.",
    icon: Smartphone,
  },

  {
    id: "whatsapp",
    label: "WhatsApp",
    description:
      "WhatsApp Business preferences.",
    icon: MessageSquare,
  },

  {
    id: "push",
    label: "Push Notifications",
    description:
      "Browser and device notifications.",
    icon: Bell,
  },

  {
    id: "web",
    label: "Web Broadcast",
    description:
      "Web broadcast preferences.",
    icon: Webhook,
  },

  {
    id: "ai",
    label: "AI & Content",
    description:
      "AI content and language preferences.",
    icon: Bot,
  },

  {
    id: "appearance",
    label: "Appearance",
    description:
      "Theme and interface preferences.",
    icon: Palette,
  },

];


// ============================================================
// LOAD SAVED SETTINGS
// ============================================================

const getInitialSettings = () => {

  try {

    const savedSettings =
      localStorage.getItem(
        "smartnotify_settings"
      );

    if (savedSettings) {

      return {
        ...DEFAULT_SETTINGS,
        ...JSON.parse(
          savedSettings
        ),
      };

    }

  } catch (error) {

    console.warn(
      "Unable to load saved settings:",
      error
    );

  }

  return {
    ...DEFAULT_SETTINGS,
  };

};


// ============================================================
// SETTINGS TOGGLE
// ============================================================

function SettingToggle({
  checked,
  onChange,
}) {

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={
        checked
          ? "sn-toggle active"
          : "sn-toggle"
      }
      onClick={() =>
        onChange(
          !checked
        )
      }
    >

      <span className="sn-toggle-thumb" />

    </button>
  );

}


// ============================================================
// SETTING ROW
// ============================================================

function SettingRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}) {

  return (
    <div className="settings-option-row">

      <div className="settings-option-left">

        <div className="settings-option-icon">
          <Icon size={17} />
        </div>

        <div>

          <strong>
            {title}
          </strong>

          <span>
            {description}
          </span>

        </div>

      </div>

      <SettingToggle
        checked={checked}
        onChange={onChange}
      />

    </div>
  );

}


// ============================================================
// SETTINGS PAGE
// ============================================================

export default function Settings() {

  const [
    profile,
    setProfile,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    saved,
    setSaved,
  ] = useState(false);

  const [
    activeSection,
    setActiveSection,
  ] = useState("profile");

  const [
    settings,
    setSettings,
  ] = useState(
    getInitialSettings
  );

  const [
    showDeleteModal,
    setShowDeleteModal,
  ] = useState(false);


  // ==========================================================
  // LOAD PROFILE
  // ==========================================================

  useEffect(() => {

    let cancelled = false;

    const loadProfile =
      async () => {

        try {

          setLoading(true);

          setError("");

          const user =
            await settingsService.getProfile();

          if (!cancelled) {

            setProfile(
              user
            );

          }

        } catch (requestError) {

          console.error(
            "Settings profile error:",
            requestError
          );

          if (!cancelled) {

            setError(
              requestError
                ?.response
                ?.data
                ?.detail ||
                "Unable to load profile."
            );

          }

        } finally {

          if (!cancelled) {

            setLoading(false);

          }

        }

      };

    loadProfile();

    return () => {

      cancelled = true;

    };

  }, []);


  // ==========================================================
  // HANDLE SETTING CHANGE
  // ==========================================================

  const handleChange = (
    key,
    value
  ) => {

    setSettings(
      (previous) => ({
        ...previous,
        [key]: value,
      })
    );

    setSaved(false);

  };


  // ==========================================================
  // SAVE SETTINGS
  // ==========================================================

  const saveSettings = () => {

    try {

      localStorage.setItem(
        "smartnotify_settings",
        JSON.stringify(
          settings
        )
      );

      setSaved(true);

      window.setTimeout(
        () => {
          setSaved(false);
        },
        3000
      );

    } catch (saveError) {

      console.error(
        "Unable to save settings:",
        saveError
      );

    }

  };


  // ==========================================================
  // RESET SETTINGS
  // ==========================================================

  const resetSettings = () => {

    const defaults = {
      ...DEFAULT_SETTINGS,
    };

    setSettings(
      defaults
    );

    localStorage.setItem(
      "smartnotify_settings",
      JSON.stringify(
        defaults
      )
    );

    setSaved(true);

    window.setTimeout(
      () => {
        setSaved(false);
      },
      3000
    );

  };


  // ==========================================================
  // SELECTED SECTION
  // ==========================================================

  const selectedSection =
    useMemo(
      () =>
        SETTINGS_SECTIONS.find(
          (section) =>
            section.id ===
            activeSection
        ) ||
        SETTINGS_SECTIONS[0],
      [
        activeSection,
      ]
    );


  // ==========================================================
  // PROFILE INITIAL
  // ==========================================================

  const profileInitial =
    String(
      profile?.name ||
        profile?.email ||
        "U"
    )
      .charAt(0)
      .toUpperCase();


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <div className="settings-page">

        <div className="settings-container">

          <div className="settings-loading">

            <div className="settings-loading-icon">
              <RotateCcw
                size={26}
              />
            </div>

            <h2>
              Loading settings
            </h2>

            <p>
              Preparing your SmartNotify
              workspace...
            </p>

          </div>

        </div>

      </div>
    );

  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {

    return (
      <div className="settings-page">

        <div className="settings-container">

          <div className="settings-error">

            <div className="settings-error-icon">
              <X
                size={23}
              />
            </div>

            <div>

              <h2>
                Settings unavailable
              </h2>

              <p>
                {error}
              </p>

            </div>

          </div>

        </div>

      </div>
    );

  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="settings-page">

      <div className="settings-container">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <section className="settings-header">

          <div className="settings-title-area">

            <div className="settings-title-icon">
              <Palette
                size={24}
              />
            </div>

            <div>

              <div className="settings-eyebrow">
                SMARTNOTIFY WORKSPACE
              </div>

              <h1>
                Settings
              </h1>

              <p>
                Manage your SmartNotify
                workspace and account preferences.
              </p>

            </div>

          </div>


          <div className="settings-header-status">

            {saved ? (

              <span className="settings-saved">

                <Check
                  size={15}
                />

                Changes saved

              </span>

            ) : (

              <span>
                Workspace preferences
              </span>

            )}

          </div>

        </section>


        {/* ====================================================
            MAIN SETTINGS LAYOUT
        ==================================================== */}

        <div className="settings-layout">


          {/* ==================================================
              LEFT NAVIGATION
          ================================================== */}

          <aside className="settings-sidebar">

            <div className="settings-sidebar-heading">

              <span>
                SETTINGS
              </span>

              <strong>
                Workspace controls
              </strong>

            </div>


            <nav className="settings-nav">

              {SETTINGS_SECTIONS.map(
                (
                  section
                ) => {

                  const Icon =
                    section.icon;

                  const active =
                    activeSection ===
                    section.id;

                  return (
                    <button
                      type="button"
                      key={
                        section.id
                      }
                      className={
                        active
                          ? "settings-nav-item active"
                          : "settings-nav-item"
                      }
                      onClick={() =>
                        setActiveSection(
                          section.id
                        )
                      }
                    >

                      <span className="settings-nav-icon">
                        <Icon
                          size={17}
                        />
                      </span>

                      <span className="settings-nav-text">

                        <strong>
                          {
                            section.label
                          }
                        </strong>

                        <small>
                          {
                            section.description
                          }
                        </small>

                      </span>

                      <ChevronRight
                        size={15}
                        className="settings-nav-arrow"
                      />

                    </button>
                  );

                }
              )}

            </nav>


            <div className="settings-sidebar-footer">

              <div className="settings-sidebar-avatar">
                {
                  profileInitial
                }
              </div>

              <div>

                <strong>
                  {
                    profile?.name ||
                    "SmartNotify User"
                  }
                </strong>

                <span>
                  {
                    profile?.email ||
                    "Workspace account"
                  }
                </span>

              </div>

            </div>

          </aside>


          {/* ==================================================
              CONTENT
          ================================================== */}

          <main className="settings-content">

            {/* =================================================
                SECTION HEADER
            ================================================= */}

            <div className="settings-section-heading">

              <div>

                <span className="settings-section-kicker">
                  {
                    selectedSection.label.toUpperCase()
                  }
                </span>

                <h2>
                  {
                    selectedSection.label
                  }
                </h2>

                <p>
                  {
                    selectedSection.description
                  }
                </p>

              </div>

            </div>


            {/* =================================================
                PROFILE
            ================================================= */}

            {activeSection ===
              "profile" && (

              <div className="settings-section-stack">

                <div className="settings-card">

                  <div className="settings-card-heading">

                    <div>

                      <h3>
                        Profile Settings
                      </h3>

                      <p>
                        Update and review your
                        SmartNotify account information.
                      </p>

                    </div>

                    <div className="settings-card-heading-icon blue">
                      <User
                        size={18}
                      />
                    </div>

                  </div>


                  <div className="settings-profile-banner">

                    <div className="settings-profile-avatar">
                      {
                        profileInitial
                      }
                    </div>

                    <div>

                      <strong>
                        {
                          profile?.name ||
                          "SmartNotify User"
                        }
                      </strong>

                      <span>
                        {
                          profile?.role ||
                          "Workspace User"
                        }
                      </span>

                    </div>

                    <div className="settings-profile-verified">

                      <Check
                        size={13}
                      />

                      Account active

                    </div>

                  </div>


                  <div className="settings-form-grid">

                    <div className="settings-field">

                      <label>
                        Full Name
                      </label>

                      <div className="settings-input-wrap">

                        <User
                          size={16}
                        />

                        <input
                          value={
                            profile?.name ||
                            ""
                          }
                          readOnly
                        />

                      </div>

                    </div>


                    <div className="settings-field">

                      <label>
                        Email Address
                      </label>

                      <div className="settings-input-wrap">

                        <Mail
                          size={16}
                        />

                        <input
                          value={
                            profile?.email ||
                            ""
                          }
                          readOnly
                        />

                      </div>

                    </div>


                    <div className="settings-field">

                      <label>
                        Role
                      </label>

                      <div className="settings-input-wrap">

                        <Shield
                          size={16}
                        />

                        <input
                          value={
                            profile?.role ||
                            ""
                          }
                          readOnly
                        />

                      </div>

                    </div>


                    <div className="settings-field">

                      <label>
                        Account ID
                      </label>

                      <div className="settings-input-wrap">

                        <KeyRound
                          size={16}
                        />

                        <input
                          value={
                            profile?.id ||
                            ""
                          }
                          readOnly
                        />

                      </div>

                    </div>

                  </div>

                </div>


                <div className="settings-card">

                  <div className="settings-card-heading">

                    <div>

                      <h3>
                        Account Overview
                      </h3>

                      <p>
                        Quick information about
                        your current SmartNotify account.
                      </p>

                    </div>

                    <UserCircle
                      size={22}
                      className="settings-heading-blue"
                    />

                  </div>


                  <div className="settings-overview-grid">

                    <div className="settings-overview-item">

                      <span>
                        Account status
                      </span>

                      <strong className="settings-active-text">
                        Active
                      </strong>

                    </div>


                    <div className="settings-overview-item">

                      <span>
                        Workspace role
                      </span>

                      <strong>
                        {
                          profile?.role ||
                          "Workspace User"
                        }
                      </strong>

                    </div>


                    <div className="settings-overview-item">

                      <span>
                        Account identifier
                      </span>

                      <strong>
                        #
                        {
                          profile?.id ||
                          "—"
                        }
                      </strong>

                    </div>

                  </div>

                </div>

              </div>

            )}


            {/* =================================================
                WORKSPACE
            ================================================= */}

            {activeSection ===
              "workspace" && (

              <div className="settings-section-stack">

                <div className="settings-card">

                  <div className="settings-card-heading">

                    <div>

                      <h3>
                        Workspace Preferences
                      </h3>

                      <p>
                        Configure defaults used
                        throughout the application.
                      </p>

                    </div>

                    <div className="settings-card-heading-icon blue">
                      <LayoutDashboard
                        size={18}
                      />
                    </div>

                  </div>


                  <div className="settings-option-list">

                    <SettingRow
                      icon={
                        LayoutDashboard
                      }
                      title="Automatic Dashboard Refresh"
                      description="Keep dashboard information refreshed automatically."
                      checked={
                        settings.autoRefresh
                      }
                      onChange={(
                        value
                      ) =>
                        handleChange(
                          "autoRefresh",
                          value
                        )
                      }
                    />

                  </div>


                  <div className="settings-field settings-select-field">

                    <label>
                      Default Language
                    </label>

                    <div className="settings-select-wrap">

                      <Globe
                        size={16}
                      />

                      <select
                        value={
                          settings.language
                        }
                        onChange={(
                          event
                        ) =>
                          handleChange(
                            "language",
                            event.target.value
                          )
                        }
                      >

                        <option value="English">
                          English
                        </option>

                        <option value="Telugu">
                          Telugu
                        </option>

                        <option value="Hindi">
                          Hindi
                        </option>

                      </select>

                    </div>

                  </div>

                </div>

              </div>

            )}


            {/* =================================================
                SECURITY
            ================================================= */}

            {activeSection ===
              "security" && (

              <div className="settings-section-stack">

                <div className="settings-card">

                  <div className="settings-card-heading">

                    <div>

                      <h3>
                        Account Security
                      </h3>

                      <p>
                        Keep your SmartNotify account
                        protected.
                      </p>

                    </div>

                    <div className="settings-card-heading-icon purple">
                      <Lock
                        size={18}
                      />
                    </div>

                  </div>


                  <div className="settings-security-row">

                    <div className="settings-security-icon">
                      <KeyRound
                        size={19}
                      />
                    </div>

                    <div>

                      <strong>
                        Password
                      </strong>

                      <span>
                        Your account password is
                        securely stored as a hash.
                      </span>

                    </div>

                    <button
                      type="button"
                      className="settings-secondary-button"
                    >
                      Change
                    </button>

                  </div>


                  <div className="settings-security-row">

                    <div className="settings-security-icon green">
                      <Shield
                        size={19}
                      />
                    </div>

                    <div>

                      <strong>
                        Two-Factor Authentication
                      </strong>

                      <span>
                        Add an additional verification
                        layer to your account.
                      </span>

                    </div>

                    <button
                      type="button"
                      className="settings-secondary-button"
                    >
                      Enable
                    </button>

                  </div>

                </div>


                <div className="settings-security-note">

                  <Shield
                    size={18}
                  />

                  <div>

                    <strong>
                      Security reminder
                    </strong>

                    <span>
                      Never share your password,
                      access token, or refresh token
                      with anyone.
                    </span>

                  </div>

                </div>

              </div>

            )}


            {/* =================================================
                NOTIFICATIONS
            ================================================= */}

            {activeSection ===
              "notifications" && (

              <div className="settings-section-stack">

                <div className="settings-card">

                  <div className="settings-card-heading">

                    <div>

                      <h3>
                        Notification Preferences
                      </h3>

                      <p>
                        Choose the SmartNotify
                        alerts you want to receive.
                      </p>

                    </div>

                    <div className="settings-card-heading-icon blue">
                      <Bell
                        size={18}
                      />
                    </div>

                  </div>


                  <div className="settings-option-list">

                    <SettingRow
                      icon={
                        Bell
                      }
                      title="Campaign Updates"
                      description="Receive updates when campaign activity changes."
                      checked={
                        settings.campaignUpdates
                      }
                      onChange={(
                        value
                      ) =>
                        handleChange(
                          "campaignUpdates",
                          value
                        )
                      }
                    />

                    <SettingRow
                      icon={
                        Mail
                      }
                      title="Delivery Alerts"
                      description="Receive notifications about message delivery."
                      checked={
                        settings.deliveryAlerts
                      }
                      onChange={(
                        value
                      ) =>
                        handleChange(
                          "deliveryAlerts",
                          value
                        )
                      }
                    />

                    <SettingRow
                      icon={
                        MessageSquare
                      }
                      title="Feedback Notifications"
                      description="Receive alerts when audience feedback arrives."
                      checked={
                        settings.feedbackNotifications
                      }
                      onChange={(
                        value
                      ) =>
                        handleChange(
                          "feedbackNotifications",
                          value
                        )
                      }
                    />

                    <SettingRow
                      icon={
                        Bot
                      }
                      title="System Notifications"
                      description="Receive platform and system-level notifications."
                      checked={
                        settings.systemNotifications
                      }
                      onChange={(
                        value
                      ) =>
                        handleChange(
                          "systemNotifications",
                          value
                        )
                      }
                    />

                  </div>

                </div>

              </div>

            )}


            {/* =================================================
                EMAIL
            ================================================= */}

            {activeSection ===
              "email" && (

              <ChannelSettings
                icon={Mail}
                title="Email Communication"
                description="Configure how email-related preferences behave."
                enabled={
                  settings.emailNotifications
                }
                onChange={(value) =>
                  handleChange(
                    "emailNotifications",
                    value
                  )
                }
              />

            )}


            {/* =================================================
                SMS
            ================================================= */}

            {activeSection ===
              "sms" && (

              <ChannelSettings
                icon={
                  Smartphone
                }
                title="SMS Communication"
                description="Manage SMS communication preferences for your workspace."
                enabled={
                  settings.notifications
                }
                onChange={(value) =>
                  handleChange(
                    "notifications",
                    value
                  )
                }
              />

            )}


            {/* =================================================
                WHATSAPP
            ================================================= */}

            {activeSection ===
              "whatsapp" && (

              <ChannelSettings
                icon={
                  MessageSquare
                }
                title="WhatsApp Business"
                description="Manage WhatsApp communication preferences."
                enabled={
                  settings.notifications
                }
                onChange={(value) =>
                  handleChange(
                    "notifications",
                    value
                  )
                }
              />

            )}


            {/* =================================================
                PUSH
            ================================================= */}

            {activeSection ===
              "push" && (

              <ChannelSettings
                icon={
                  Bell
                }
                title="Push Notifications"
                description="Control browser and device notification preferences."
                enabled={
                  settings.notifications
                }
                onChange={(value) =>
                  handleChange(
                    "notifications",
                    value
                  )
                }
              />

            )}


            {/* =================================================
                WEB
            ================================================= */}

            {activeSection ===
              "web" && (

              <ChannelSettings
                icon={
                  Webhook
                }
                title="Web Broadcast"
                description="Manage web broadcast communication preferences."
                enabled={
                  settings.notifications
                }
                onChange={(value) =>
                  handleChange(
                    "notifications",
                    value
                  )
                }
              />

            )}


            {/* =================================================
                AI
            ================================================= */}

            {activeSection ===
              "ai" && (

              <div className="settings-section-stack">

                <div className="settings-card">

                  <div className="settings-card-heading">

                    <div>

                      <h3>
                        AI & Content
                      </h3>

                      <p>
                        Preferences related to
                        AI-generated communication content.
                      </p>

                    </div>

                    <div className="settings-card-heading-icon purple">
                      <Bot
                        size={18}
                      />
                    </div>

                  </div>


                  <div className="settings-ai-grid">

                    <div className="settings-ai-item">

                      <div className="settings-ai-icon">
                        <Bot
                          size={18}
                        />
                      </div>

                      <strong>
                        AI Content Generation
                      </strong>

                      <span>
                        SmartNotify AI tools can
                        assist with campaign content.
                      </span>

                    </div>


                    <div className="settings-ai-item">

                      <div className="settings-ai-icon green">
                        <Globe
                          size={18}
                        />
                      </div>

                      <strong>
                        Multilingual Content
                      </strong>

                      <span>
                        Translation preferences are
                        available during campaign creation.
                      </span>

                    </div>

                  </div>

                </div>

              </div>

            )}


            {/* =================================================
                APPEARANCE
            ================================================= */}

            {activeSection ===
              "appearance" && (

              <div className="settings-section-stack">

                <div className="settings-card">

                  <div className="settings-card-heading">

                    <div>

                      <h3>
                        Appearance
                      </h3>

                      <p>
                        Customize the visual preference
                        saved for your SmartNotify workspace.
                      </p>

                    </div>

                    <div className="settings-card-heading-icon orange">
                      <Palette
                        size={18}
                      />
                    </div>

                  </div>


                  <div className="settings-theme-grid">

                    <button
                      type="button"
                      className={
                        settings.theme ===
                        "Light"
                          ? "settings-theme-card active"
                          : "settings-theme-card"
                      }
                      onClick={() =>
                        handleChange(
                          "theme",
                          "Light"
                        )
                      }
                    >

                      <div className="settings-theme-preview light">

                        <div />

                        <div />

                        <div />

                      </div>

                      <strong>
                        Light
                      </strong>

                      <span>
                        Bright interface
                      </span>

                      {settings.theme ===
                        "Light" && (
                        <Check
                          size={16}
                          className="settings-theme-check"
                        />
                      )}

                    </button>


                    <button
                      type="button"
                      className={
                        settings.theme ===
                        "Dark"
                          ? "settings-theme-card active"
                          : "settings-theme-card"
                      }
                      onClick={() =>
                        handleChange(
                          "theme",
                          "Dark"
                        )
                      }
                    >

                      <div className="settings-theme-preview dark">

                        <div />

                        <div />

                        <div />

                      </div>

                      <strong>
                        Dark
                      </strong>

                      <span>
                        Dark interface
                      </span>

                      {settings.theme ===
                        "Dark" && (
                        <Check
                          size={16}
                          className="settings-theme-check"
                        />
                      )}

                    </button>


                    <button
                      type="button"
                      className={
                        settings.theme ===
                        "System"
                          ? "settings-theme-card active"
                          : "settings-theme-card"
                      }
                      onClick={() =>
                        handleChange(
                          "theme",
                          "System"
                        )
                      }
                    >

                      <div className="settings-theme-preview system">

                        <div />

                        <div />

                        <div />

                      </div>

                      <strong>
                        System
                      </strong>

                      <span>
                        Follow device
                      </span>

                      {settings.theme ===
                        "System" && (
                        <Check
                          size={16}
                          className="settings-theme-check"
                        />
                      )}

                    </button>

                  </div>

                </div>

              </div>

            )}


            {/* =================================================
                DANGER ZONE
            ================================================= */}

            <div className="settings-danger-card">

              <div className="settings-danger-icon">

                <Trash2
                  size={18}
                />

              </div>

              <div className="settings-danger-content">

                <strong>
                  Danger Zone
                </strong>

                <span>
                  Account deletion is a permanent
                  administrative action.
                </span>

              </div>

              <button
                type="button"
                className="settings-danger-button"
                onClick={() =>
                  setShowDeleteModal(
                    true
                  )
                }
              >
                Delete Account
              </button>

            </div>


            {/* =================================================
                ACTION BAR
            ================================================= */}

            <div className="settings-action-bar">

              <div>

                {saved && (

                  <span className="settings-save-message">

                    <Check
                      size={15}
                    />

                    Settings saved successfully.

                  </span>

                )}

              </div>


              <div className="settings-action-buttons">

                <button
                  type="button"
                  className="settings-reset-button"
                  onClick={
                    resetSettings
                  }
                >

                  <RotateCcw
                    size={16}
                  />

                  Reset

                </button>


                <button
                  type="button"
                  className="settings-save-button"
                  onClick={
                    saveSettings
                  }
                >

                  <Save
                    size={16}
                  />

                  Save Changes

                </button>

              </div>

            </div>

          </main>

        </div>

      </div>


      {/* ======================================================
          DELETE ACCOUNT MODAL
      ====================================================== */}

      {showDeleteModal && (

        <div
          className="settings-modal-backdrop"
          onMouseDown={(
            event
          ) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              setShowDeleteModal(
                false
              );

            }

          }}
        >

          <div
            className="settings-delete-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="settings-delete-modal-icon">
              <Trash2
                size={24}
              />
            </div>

            <h3>
              Delete Account?
            </h3>

            <p>
              This action is permanent.
              Your account and associated
              workspace access would need
              administrator handling.
            </p>

            <div className="settings-delete-warning">

              <Lock
                size={15}
              />

              <span>
                Account deletion is protected
                and is not performed by this
                settings screen.
              </span>

            </div>

            <div className="settings-modal-actions">

              <button
                type="button"
                className="settings-secondary-button"
                onClick={() =>
                  setShowDeleteModal(
                    false
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="settings-danger-button"
                onClick={() => {

                  setShowDeleteModal(
                    false
                  );

                  window.alert(
                    "Please contact the administrator to permanently delete this SmartNotify account."
                  );

                }}
              >
                Contact Administrator
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );

}


// ============================================================
// CHANNEL SETTINGS COMPONENT
// ============================================================

function ChannelSettings({
  icon: Icon,
  title,
  description,
  enabled,
  onChange,
}) {

  return (
    <div className="settings-section-stack">

      <div className="settings-card">

        <div className="settings-card-heading">

          <div>

            <h3>
              {title}
            </h3>

            <p>
              {description}
            </p>

          </div>

          <div className="settings-card-heading-icon blue">

            <Icon
              size={18}
            />

          </div>

        </div>


        <div className="settings-channel-hero">

          <div className="settings-channel-icon">
            <Icon
              size={24}
            />
          </div>

          <div>

            <strong>
              Channel availability
            </strong>

            <span>
              Enable or disable this channel's
              related notification preference.
            </span>

          </div>

          <SettingToggle
            checked={
              enabled
            }
            onChange={
              onChange
            }
          />

        </div>


        <div className="settings-channel-info-grid">

          <div>

            <span>
              Status
            </span>

            <strong
              className={
                enabled
                  ? "settings-active-text"
                  : "settings-disabled-text"
              }
            >
              {enabled
                ? "Enabled"
                : "Disabled"}
            </strong>

          </div>


          <div>

            <span>
              Configuration
            </span>

            <strong>
              Managed by workspace
            </strong>

          </div>


          <div>

            <span>
              Delivery
            </span>

            <strong>
              Campaign based
            </strong>

          </div>

        </div>

      </div>

    </div>
  );

}