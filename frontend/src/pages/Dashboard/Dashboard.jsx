import { useEffect, useMemo, useState } from "react";

import {
  registerForPushNotifications,
  connectWebBroadcast,
  disconnectWebBroadcast,
} from "../../services/notificationService";

import {
  ArrowUpRight,
  BarChart3,
  BellRing,
  CheckCircle2,
  ChevronRight,
  Globe2,
  Megaphone,
  MessageSquareText,
  Send,
  Sparkles,
  Target,
  Users,
  Clock3,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  listenForForegroundMessages,
} from "../../firebase";

import dashboardService from "../../services/dashboardService";
import campaignService from "../../services/campaignService";

import { useAuth } from "../../hooks/useAuth";


// ============================================================
// MONTHS
// ============================================================

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
];


// ============================================================
// FALLBACK REACH
// ============================================================

const fallbackReach = [
  12000,
  16000,
  20500,
  30000,
  28000,
  39000,
  45000,
  52000,
];


// ============================================================
// FALLBACK LANGUAGES
// ============================================================

const fallbackLanguages = [
  {
    name: "Telugu",
    value: 42,
    count: "42,000",
  },
  {
    name: "Hindi",
    value: 28,
    count: "31,000",
  },
  {
    name: "English",
    value: 18,
    count: "20,000",
  },
  {
    name: "Tamil",
    value: 8,
    count: "8,500",
  },
];


// ============================================================
// FALLBACK CHANNELS
// ============================================================

const fallbackChannels = [
  {
    name: "WhatsApp",
    value: 82,
  },
  {
    name: "SMS",
    value: 54,
  },
  {
    name: "Email",
    value: 41,
  },
  {
    name: "Push",
    value: 68,
  },
  {
    name: "Web",
    value: 74,
  },
];


// ============================================================
// PIE COLORS
// ============================================================

const PIE_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#94a3b8",
  "#10b981",
  "#f59e0b",
];


// ============================================================
// HELPERS
// ============================================================

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(
    Number(value) || 0
  );
}


function getUserName(user) {
  if (!user) {
    return "Administrator";
  }

  return (
    user.full_name ||
    user.name ||
    user.username ||
    user.email?.split("@")[0] ||
    "Administrator"
  );
}


// ============================================================
// COMMUNICATION TEAM HELPERS
// ============================================================

function normalizeCampaigns(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.campaigns)) return data.campaigns;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function formatSchedule(value) {
  if (!value) return "Schedule pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Schedule pending";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatChannels(channels) {
  if (Array.isArray(channels) && channels.length) {
    return channels
      .map((channel) =>
        String(channel)
          .replaceAll("_", " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase())
      )
      .join(", ");
  }
  if (typeof channels === "string" && channels.trim()) {
    return channels
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
  return "Multi-channel";
}


// ============================================================
// DASHBOARD
// ============================================================

export default function Dashboard() {

  const { currentUser } = useAuth();

  const roleLabel =
    currentUser?.role === "Admin"
      ? "ADMINISTRATOR"
      : (
          currentUser?.role ||
          "WORKSPACE"
        ).toUpperCase();


  const [data, setData] = useState(null);

  const [campaignsData, setCampaignsData] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // Current time is updated outside render so the dashboard remains
  // compatible with React's render-purity rules.
  const [currentTime, setCurrentTime] =
    useState(0);

  useEffect(() => {
    const updateCurrentTime = () => {
      setCurrentTime(Date.now());
    };

    updateCurrentTime();

    const timer = window.setInterval(
      updateCurrentTime,
      60 * 1000
    );

    return () => {
      window.clearInterval(timer);
    };
  }, []);


// ============================================================
// FIREBASE PUSH NOTIFICATION REGISTRATION
// ============================================================

  useEffect(() => {

    let cancelled = false;


    async function setupPushNotifications() {

      try {

        if (
          "Notification" in window &&
          Notification.permission === "denied"
        ) {

          console.warn(
            "Push notifications are blocked by the browser."
          );

          return;
        }


        const token =
          await registerForPushNotifications();


        if (
          !cancelled &&
          token
        ) {

          console.log(
            "FCM registration successful."
          );

        }

      } catch (err) {

        console.error(
          "Push notification setup failed:",
          err
        );

      }

    }


    setupPushNotifications();


    return () => {

      cancelled = true;

    };

  }, []);


// ============================================================
// WEB BROADCAST WEBSOCKET
// ============================================================

  useEffect(() => {

    console.log(
      "================================================"
    );

    console.log(
      "SMARTNOTIFY WEB BROADCAST"
    );

    console.log(
      "Connecting Dashboard to WebSocket..."
    );

    console.log(
      "================================================"
    );


    const socket =
      connectWebBroadcast(
        (message) => {

          console.log(
            "📢 SmartNotify Web Broadcast received:",
            message
          );


          // --------------------------------------------------
          // Extract title
          // --------------------------------------------------

          const title =
            message?.subject ||
            message?.title ||
            "SmartNotify";


          // --------------------------------------------------
          // Extract message body
          // --------------------------------------------------

          const body =
            message?.content ||
            message?.message ||
            "New SmartNotify broadcast received.";


          // --------------------------------------------------
          // Browser notification
          // --------------------------------------------------

          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {

            try {

              new Notification(
                title,
                {
                  body,
                }
              );

            } catch (notificationError) {

              console.error(
                "Browser notification failed:",
                notificationError
              );

            }

          }


          // --------------------------------------------------
          // Dispatch global event
          //
          // Other frontend components can listen to:
          //
          // smartnotify-web-broadcast
          // --------------------------------------------------

          window.dispatchEvent(
            new CustomEvent(
              "smartnotify-web-broadcast",
              {
                detail: message,
              }
            )
          );

        }
      );


    console.log(
      "Web Broadcast socket:",
      socket
    );


    return () => {

      console.log(
        "Disconnecting SmartNotify Web Broadcast..."
      );

      disconnectWebBroadcast();

    };

  }, []);


// ============================================================
// LOAD DASHBOARD DATA
// ============================================================

  useEffect(() => {

    let cancelled = false;


    async function loadDashboard() {

      try {

        setLoading(true);

        setError("");


        const result =
          await dashboardService.getDashboard();

        let campaignResult = [];

        if (currentUser?.role === "Communication Team") {
          try {
            campaignResult = normalizeCampaigns(
              await campaignService.getAll()
            );
          } catch (campaignError) {
            console.warn(
              "Communication campaign list could not be loaded:",
              campaignError
            );
          }
        }


        if (!cancelled) {

          setData(
            result || {}
          );

          setCampaignsData(
            campaignResult
          );

        }

      } catch (err) {

        console.error(
          "Dashboard error:",
          err
        );


        if (!cancelled) {

          setError(
            err?.response?.data?.detail ||
            "Unable to load dashboard data."
          );

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }


    loadDashboard();


    return () => {

      cancelled = true;

    };

  }, [currentUser?.role]);


// ============================================================
// CAMPAIGN STATUS
// ============================================================

  const campaignStatus =
    useMemo(
      () =>
        data?.campaign_status ||
        {},
      [data]
    );


  const activeCampaigns =
    useMemo(
      () =>
        (campaignStatus.approved || 0) +
        (campaignStatus.scheduled || 0) +
        (campaignStatus.sending || 0),

      [campaignStatus]
    );


// ============================================================
// FIREBASE FOREGROUND MESSAGES
// ============================================================

  useEffect(() => {

    let unsubscribe = null;


    listenForForegroundMessages(
      (payload) => {

        const title =
          payload.notification?.title ||
          "AI Mass Communication";


        const body =
          payload.notification?.body ||
          "You have a new notification.";


        console.log(
          "Notification received:",
          title,
          body
        );


        if (
          "Notification" in window &&
          Notification.permission === "granted"
        ) {

          new Notification(
            title,
            {
              body,
            }
          );

        }

      }
    ).then(
      (cleanup) => {

        unsubscribe = cleanup;

      }
    );


    return () => {

      if (
        typeof unsubscribe ===
        "function"
      ) {

        unsubscribe();

      }

    };

  }, []);


// ============================================================
// MONTHLY REACH
// ============================================================

  const monthlyReach =
    useMemo(() => {

      const source =
        data?.monthly_reach ||
        data?.monthlyReach;


      if (
        Array.isArray(source) &&
        source.length
      ) {

        return source.map(
          (item, index) => ({

            month:
              item.month ||
              MONTHS[index] ||
              `M${index + 1}`,

            reach: Number(
              item.reach ??
              item.value ??
              0
            ),

          })
        );

      }


      return MONTHS.map(
        (month, index) => ({

          month,

          reach:
            fallbackReach[index],

        })
      );

    }, [data]);


// ============================================================
// LANGUAGE DATA
// ============================================================

  const languageData =
    useMemo(() => {

      const source =
        data?.language_distribution ||
        data?.languageDistribution;


      if (
        Array.isArray(source) &&
        source.length
      ) {

        return source.map(
          (item) => ({

            name:
              item.name ||
              item.language ||
              "Unknown",

            value: Number(
              item.value ??
              item.percentage ??
              0
            ),

            count:
              item.count ||
              formatNumber(
                item.total || 0
              ),

          })
        );

      }


      return fallbackLanguages;

    }, [data]);


// ============================================================
// CHANNEL DATA
// ============================================================

  const channelData =
    useMemo(() => {

      const source =
        data?.channel_engagement ||
        data?.channelEngagement;


      if (
        Array.isArray(source) &&
        source.length
      ) {

        return source.map(
          (item) => ({

            name:
              item.name ||
              item.channel ||
              "Channel",

            value: Number(
              item.value ??
              item.rate ??
              0
            ),

          })
        );

      }


      return fallbackChannels;

    }, [data]);


// ============================================================
// CAMPAIGN STATUS PIE
// ============================================================

  const statusPie =
    useMemo(
      () =>
        [
          {
            name: "Approved",
            value:
              campaignStatus.approved ||
              0,
          },

          {
            name: "Scheduled",
            value:
              campaignStatus.scheduled ||
              0,
          },

          {
            name: "Draft",
            value:
              campaignStatus.draft ||
              0,
          },

          {
            name: "Completed",
            value:
              campaignStatus.completed ||
              0,
          },

          {
            name: "Pending Review",
            value:
              campaignStatus.pending_review ||
              0,
          },

        ].filter(
          (item) =>
            item.value > 0
        ),

      [campaignStatus]
    );


// ============================================================
// COMMUNICATION TEAM OPERATIONAL DATA
// ============================================================

  const upcomingRuns = useMemo(() => {
    if (currentUser?.role !== "Communication Team") return [];

    const now = currentTime;

    return campaignsData
      .filter((campaign) => {
        const status = String(campaign?.status || "").toLowerCase();
        return ["scheduled", "approved", "sending"].includes(status);
      })
      .map((campaign) => {
        const schedule =
          campaign?.next_run_at ||
          campaign?.schedule_time ||
          campaign?.scheduled_at;

        const scheduleTimestamp = schedule
          ? new Date(schedule).getTime()
          : Number.MAX_SAFE_INTEGER;

        return { ...campaign, schedule, scheduleTimestamp };
      })
      .filter((campaign) =>
        campaign.scheduleTimestamp >= now ||
        campaign.scheduleTimestamp === Number.MAX_SAFE_INTEGER
      )
      .sort((a, b) => a.scheduleTimestamp - b.scheduleTimestamp)
      .slice(0, 4);
  }, [campaignsData, currentUser?.role, currentTime]);


  const communicationAlerts = useMemo(() => {
    if (currentUser?.role !== "Communication Team") return [];

    const alerts = [];
    const failedCount = Number(data?.delivery?.failed ?? data?.failed ?? 0);
    const retryingCount = Number(data?.delivery?.retrying ?? data?.retrying ?? 0);
    const scheduledCount = Number(campaignStatus.scheduled || 0);

    if (failedCount > 0) {
      alerts.push({
        icon: AlertTriangle,
        title: `${formatNumber(failedCount)} failed deliveries`,
        description: "Review delivery tracking for messages requiring attention.",
        tone: "red",
        path: "/delivery-tracking",
      });
    }

    if (retryingCount > 0) {
      alerts.push({
        icon: RefreshCw,
        title: `${formatNumber(retryingCount)} messages retrying`,
        description: "Automatic retries are currently active.",
        tone: "orange",
        path: "/delivery-tracking",
      });
    }

    if (scheduledCount > 0) {
      alerts.push({
        icon: Clock3,
        title: `${formatNumber(scheduledCount)} campaigns scheduled`,
        description: "Upcoming communication runs are waiting for execution.",
        tone: "blue",
        path: "/campaign",
      });
    }

    if (!alerts.length) {
      alerts.push({
        icon: CheckCircle2,
        title: "Operations are healthy",
        description: "No delivery issues currently require attention.",
        tone: "green",
        path: "/delivery-tracking",
      });
    }

    return alerts.slice(0, 3);
  }, [currentUser?.role, data, campaignStatus]);


  const recentCommunicationActivity = useMemo(() => {
    if (currentUser?.role !== "Communication Team") return [];

    return [...campaignsData]
      .filter((campaign) => campaign?.campaign_name || campaign?.name)
      .sort((a, b) => {
        const aTime = new Date(a?.last_run_at || a?.updated_at || a?.schedule_time || 0).getTime();
        const bTime = new Date(b?.last_run_at || b?.updated_at || b?.schedule_time || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 4);
  }, [campaignsData, currentUser?.role]);


// ============================================================
// LOADING
// ============================================================

  if (loading) {

    return (

      <div className="dashboard-page">

        <div
          className="dashboard-skeleton hero-skeleton"
        />


        <div className="dashboard-skeleton-grid">

          {Array.from({
            length: 4,
          }).map(
            (_, index) => (

              <div
                className="dashboard-skeleton"
                key={index}
              />

            )
          )}

        </div>

      </div>

    );

  }


// ============================================================
// ERROR
// ============================================================

  if (error) {

    return (

      <div className="dashboard-page">

        <div className="dashboard-error">

          <BellRing size={22} />


          <div>

            <strong>
              Dashboard could not be loaded
            </strong>


            <p>
              {error}
            </p>

          </div>

        </div>

      </div>

    );

  }


// ============================================================
// DASHBOARD VALUES
// ============================================================

  const userName =
    getUserName(
      currentUser
    );


  const targetAudiences =
    data?.audience ?? 0;


  const campaigns =
    data?.campaigns ?? 0;


  const users =
    data?.users ?? 0;


  const templates =
    data?.templates ?? 0;


  const reachValue =
    data?.messages_sent ??
    data?.messagesSent ??
    82500;


  const engagement =
    data?.engagement_rate ??
    data?.engagementRate ??
    64.2;


// ============================================================
// UI
// ============================================================

  return (

    <div className="dashboard-page">

      <style>{`
        .communication-operations-panel {
          align-items: stretch;
          margin-top: 24px;
        }

        .communication-operations-panel > .dashboard-panel {
          min-height: 430px;
          display: flex;
          flex-direction: column;
        }

        .communication-run-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 18px;
        }

        .communication-run-row {
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr) auto;
          align-items: center;
          gap: 14px;
          padding: 14px;
          border: 1px solid #e6edf5;
          border-radius: 16px;
          background: linear-gradient(135deg, #fbfdff 0%, #f8fbff 100%);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .communication-run-row:hover {
          transform: translateY(-1px);
          border-color: #cfe0f8;
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.07);
        }

        .communication-run-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #eff6ff;
          color: #2563eb;
        }

        .communication-run-content {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .communication-run-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .communication-run-title-row strong {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #07152f;
          font-size: 14px;
        }

        .communication-run-content > span {
          color: #7b8ca5;
          font-size: 12px;
          font-weight: 500;
        }

        .communication-run-status {
          flex-shrink: 0;
          border-radius: 999px;
          padding: 4px 8px;
          background: #eef2ff;
          color: #4f46e5;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .communication-run-time {
          min-width: 112px;
          text-align: right;
        }

        .communication-run-time small {
          display: block;
          margin-bottom: 4px;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .communication-run-time strong {
          display: block;
          color: #07152f;
          font-size: 12px;
          white-space: nowrap;
        }

        .communication-empty-state {
          min-height: 260px;
          display: flex;
          flex: 1;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 8px;
          padding: 30px;
          border: 1px dashed #cbd8e8;
          border-radius: 18px;
          background: #f8fbff;
          color: #7b8ca5;
          text-align: center;
        }

        .communication-empty-state svg {
          color: #2563eb;
          margin-bottom: 3px;
        }

        .communication-empty-state strong {
          color: #07152f;
          font-size: 14px;
        }

        .communication-empty-state span {
          max-width: 300px;
          font-size: 12px;
          line-height: 1.5;
        }

        .communication-alert-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
          margin-top: 18px;
        }

        .communication-alert-row {
          width: 100%;
          display: grid;
          grid-template-columns: 38px minmax(0, 1fr) 18px;
          align-items: center;
          gap: 11px;
          padding: 12px;
          border: 1px solid #e7edf5;
          border-radius: 14px;
          background: #fff;
          text-align: left;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .communication-alert-row:hover {
          transform: translateX(2px);
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
        }

        .communication-alert-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 11px;
        }

        .communication-alert-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .communication-alert-copy strong {
          color: #07152f;
          font-size: 13px;
        }

        .communication-alert-copy span {
          color: #7b8ca5;
          font-size: 11px;
          line-height: 1.45;
        }

        .communication-alert-row > svg {
          color: #94a3b8;
        }

        .communication-alert-red .communication-alert-icon {
          background: #fff1f2;
          color: #e11d48;
        }

        .communication-alert-orange .communication-alert-icon {
          background: #fffbeb;
          color: #d97706;
        }

        .communication-alert-blue .communication-alert-icon {
          background: #eff6ff;
          color: #2563eb;
        }

        .communication-alert-green .communication-alert-icon {
          background: #ecfdf5;
          color: #059669;
        }

        .communication-activity-divider {
          height: 1px;
          margin: 18px 0 16px;
          background: #edf2f7;
        }

        .communication-activity-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .communication-activity-heading > div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .communication-activity-heading span {
          color: #94a3b8;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.09em;
        }

        .communication-activity-heading strong {
          color: #07152f;
          font-size: 13px;
        }

        .communication-inline-link {
          border: 0;
          background: transparent;
          color: #2563eb;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .communication-activity-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: 10px;
        }

        .communication-activity-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 9px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .communication-activity-row:last-child {
          border-bottom: 0;
        }

        .communication-activity-row > div {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .communication-activity-row strong {
          overflow: hidden;
          color: #1e293b;
          font-size: 12px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .communication-activity-row > div > span {
          color: #94a3b8;
          font-size: 10px;
        }

        .communication-activity-status {
          flex-shrink: 0;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 9px;
          font-weight: 800;
        }

        .communication-activity-status.active {
          background: #eff6ff;
          color: #2563eb;
        }

        .communication-activity-status.completed {
          background: #ecfdf5;
          color: #059669;
        }

        .communication-activity-status.failed {
          background: #fff1f2;
          color: #e11d48;
        }

        .communication-activity-empty {
          padding: 14px 0 4px;
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.5;
        }

        @media (max-width: 900px) {
          .communication-operations-panel {
            grid-template-columns: 1fr;
          }

          .communication-operations-panel > .dashboard-panel {
            min-height: auto;
          }
        }

        @media (max-width: 640px) {
          .communication-run-row {
            grid-template-columns: 38px minmax(0, 1fr);
          }

          .communication-run-time {
            grid-column: 2;
            min-width: 0;
            text-align: left;
          }

          .communication-run-title-row {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>


      {/* =====================================================
          WELCOME / HERO
          ===================================================== */}

      <div className="dashboard-topline">

        <div>

          <div className="dashboard-eyebrow">

            <span className="dashboard-eyebrow-badge">

              {roleLabel}

            </span>


            <span>
              Department Portal
            </span>

          </div>


          <h1 className="dashboard-title">

            Welcome back, {userName}

          </h1>


          <p className="dashboard-description">

            Real-time public communication
            oversight across regional audiences,
            AI translation engines, and
            multi-channel delivery channels.

          </p>

        </div>


        <div className="dashboard-hero-actions">

          <button
            type="button"
            className="dashboard-secondary-action"
          >

            <Users size={18} />

            Manage Audiences

          </button>


          <button
            type="button"
            className="dashboard-primary-action"
          >

            <Sparkles size={18} />

            AI Campaign Tools

          </button>

        </div>

      </div>


      {/* =====================================================
          KPI CARDS
          ===================================================== */}

      <section className="dashboard-kpi-grid">


        <div className="dashboard-kpi-card">

          <div className="dashboard-kpi-head">

            <span>
              Target Audiences
            </span>


            <span className="dashboard-icon-box blue">

              <Target size={20} />

            </span>

          </div>


          <strong>

            {formatNumber(
              targetAudiences
            )}

          </strong>


          <p>

            <span className="positive">
              ↗ +12%
            </span>{" "}

            104,900 Verified Citizens

          </p>

        </div>


        <div className="dashboard-kpi-card">

          <div className="dashboard-kpi-head">

            <span>
              Active Campaigns
            </span>


            <span className="dashboard-icon-box purple">

              <Megaphone size={20} />

            </span>

          </div>


          <strong>

            {formatNumber(
              activeCampaigns ||
              campaigns
            )}

          </strong>


          <p>

            <span className="purple-text">

              {campaignStatus.scheduled ||
                0}{" "}

              Scheduled

            </span>

            {" • "}

            {campaignStatus.pending_review ||
              0}{" "}

            Pending Review

          </p>

        </div>


        <div className="dashboard-kpi-card">

          <div className="dashboard-kpi-head">

            <span>
              Messages Sent
            </span>


            <span className="dashboard-icon-box green">

              <Send size={20} />

            </span>

          </div>


          <strong>

            {formatNumber(
              reachValue
            )}

          </strong>


          <p>

            <span className="positive">

              98.4%

            </span>{" "}

            Delivery Success Rate

          </p>

        </div>


        <div className="dashboard-kpi-card">

          <div className="dashboard-kpi-head">

            <span>
              Avg Engagement Rate
            </span>


            <span className="dashboard-icon-box orange">

              <ArrowUpRight size={20} />

            </span>

          </div>


          <strong>

            {Number(
              engagement
            ).toFixed(1)}

            %

          </strong>


          <p>

            <span className="orange-text">

              High on WhatsApp

            </span>{" "}

            (82% Reads)

          </p>

        </div>


      </section>


      {/* =====================================================
          MONTHLY REACH
          ===================================================== */}

      <section className="dashboard-panel dashboard-chart-panel">

        <div className="dashboard-panel-heading">

          <div>

            <h2>

              Monthly Public Reach &amp;
              Broadcast Volume

            </h2>


            <p>

              2026 Monthly message distribution
              across all channels

            </p>

          </div>


          <button
            type="button"
            className="dashboard-link-button"
          >

            Full Analytics

            <ChevronRight size={16} />

          </button>

        </div>


        <div className="dashboard-chart-wrap">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <AreaChart
              data={monthlyReach}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >

              <defs>

                <linearGradient
                  id="reachGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >

                  <stop
                    offset="0%"
                    stopColor="#2563eb"
                    stopOpacity={0.28}
                  />

                  <stop
                    offset="100%"
                    stopColor="#2563eb"
                    stopOpacity={0.03}
                  />

                </linearGradient>

              </defs>


              <CartesianGrid
                vertical={false}
                stroke="#e7edf5"
              />


              <XAxis
                dataKey="month"
                axisLine={{
                  stroke: "#94a3b8",
                }}
                tickLine={false}
                tick={{
                  fill: "#8ca0ba",
                  fontSize: 13,
                }}
              />


              <YAxis
                axisLine={{
                  stroke: "#94a3b8",
                }}
                tickLine={false}
                tick={{
                  fill: "#8ca0ba",
                  fontSize: 13,
                }}
              />


              <Tooltip
                formatter={(value) => [
                  formatNumber(value),
                  "Reach",
                ]}
              />


              <Area
                type="monotone"
                dataKey="reach"
                stroke="#2563eb"
                strokeWidth={3}
                fill="url(#reachGradient)"
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>

      </section>


      {/* =====================================================
          CAMPAIGN DISTRIBUTION + LANGUAGES
          ===================================================== */}

      <section className="dashboard-two-column">


        <div className="dashboard-panel">

          <div className="dashboard-panel-heading compact">

            <div>

              <h2>
                Campaign Distribution
              </h2>

              <p>
                Current campaign workflow status
              </p>

            </div>

          </div>


          <div className="dashboard-donut-layout">

            <div className="dashboard-donut">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={
                      statusPie.length
                        ? statusPie
                        : [
                            {
                              name:
                                "No campaigns",
                              value: 1,
                            },
                          ]
                    }
                    dataKey="value"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={3}
                    stroke="none"
                  >

                    {(
                      statusPie.length
                        ? statusPie
                        : [
                            {
                              name:
                                "No campaigns",
                              value: 1,
                            },
                          ]
                    ).map(
                      (entry, index) => (

                        <Cell
                          key={
                            entry.name
                          }
                          fill={
                            PIE_COLORS[
                              index %
                                PIE_COLORS.length
                            ]
                          }
                        />

                      )
                    )}

                  </Pie>


                  <Tooltip />

                </PieChart>

              </ResponsiveContainer>


              <div className="dashboard-donut-center">

                <strong>

                  {formatNumber(
                    campaigns
                  )}

                </strong>


                <span>
                  Total
                </span>

              </div>

            </div>


            <div className="dashboard-legend">

              {(
                statusPie.length
                  ? statusPie
                  : [
                      {
                        name:
                          "No campaigns",
                        value: 0,
                      },
                    ]
              ).map(
                (item, index) => (

                  <div
                    className="dashboard-legend-row"
                    key={item.name}
                  >

                    <span>

                      <i
                        style={{
                          background:
                            PIE_COLORS[
                              index %
                                PIE_COLORS.length
                            ],
                        }}
                      />

                      {item.name}

                    </span>


                    <strong>
                      {item.value}
                    </strong>

                  </div>

                )
              )}

            </div>

          </div>

        </div>


        <div className="dashboard-panel">

          <div className="dashboard-panel-heading compact">

            <div>

              <h2>
                Regional Language
                Distribution
              </h2>


              <p>

                <span className="blue-text">
                  8 Indian Languages
                </span>

              </p>

            </div>


            <Globe2
              size={22}
              className="panel-heading-icon"
            />

          </div>


          <div className="language-list">

            {languageData.map(
              (item) => (

                <div
                  className="language-row"
                  key={item.name}
                >

                  <div className="language-row-top">

                    <strong>
                      {item.name}
                    </strong>


                    <span>

                      {item.count} (
                      {item.value}
                      %)

                    </span>

                  </div>


                  <div className="language-bar">

                    <span
                      style={{
                        width: `${Math.min(
                          item.value,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>

              )
            )}

          </div>

        </div>


      </section>


      {/* =====================================================
          CHANNEL ENGAGEMENT + RECENT CAMPAIGNS
          ===================================================== */}

      <section className="dashboard-two-column">


        <div className="dashboard-panel">

          <div className="dashboard-panel-heading compact">

            <div>

              <h2>
                Channel Engagement Rates
              </h2>


              <p>
                Active delivery gateways
              </p>

            </div>


            <BarChart3
              size={22}
              className="panel-heading-icon purple-icon"
            />

          </div>


          <div className="dashboard-bar-chart">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={channelData}
                margin={{
                  top: 10,
                  right: 0,
                  left: -25,
                  bottom: 0,
                }}
              >

                <CartesianGrid
                  vertical={false}
                  stroke="#eef2f7"
                />


                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fill: "#8294ae",
                    fontSize: 12,
                  }}
                />


                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fill: "#8294ae",
                    fontSize: 12,
                  }}
                />


                <Tooltip
                  formatter={(value) => [
                    `${value}%`,
                    "Engagement",
                  ]}
                />


                <Bar
                  dataKey="value"
                  fill="#5146e5"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>


        <div className="dashboard-panel recent-campaign-panel">

          <div className="dashboard-panel-heading compact">

            <div>

              <h2>
                Recent Awareness
                Campaigns
              </h2>


              <p>
                Manage campaign workflow
                and AI content review
              </p>

            </div>


            <button
              type="button"
              className="dashboard-link-button"
            >

              View All

              <ChevronRight size={16} />

            </button>

          </div>


          <div className="campaign-list">

            <div className="campaign-list-header">

              <span>
                CAMPAIGN NAME
              </span>


              <span>
                TYPE
              </span>


              <span>
                LANGUAGE
              </span>

            </div>


            <div className="campaign-list-row">

              <div>

                <strong>
                  Save Water for Future
                  Generations
                </strong>


                <span>
                  Hydrology College
                  Students
                </span>

              </div>


              <span className="tag blue-tag">
                Environmental
              </span>


              <span>
                Telugu
              </span>

            </div>


            <div className="campaign-list-row">

              <div>

                <strong>
                  Monsoon Dengue &amp;
                  Malaria Prevention Drive
                </strong>


                <span>
                  Primary Healthcare
                  Workers
                </span>

              </div>


              <span className="tag green-tag">
                Health Awareness
              </span>


              <span>
                Marathi
              </span>

            </div>


            <div className="campaign-list-row">

              <div>

                <strong>
                  Kisan Credit Scheme
                  &amp; Soil Health Guidance
                </strong>


                <span>
                  Telangana Farmers
                </span>

              </div>


              <span className="tag orange-tag">
                Financial Literacy
              </span>


              <span>
                Telugu
              </span>

            </div>


          </div>

        </div>


      </section>


      {/* =====================================================
          COMMUNICATION TEAM OPERATIONS
          ===================================================== */}

      {currentUser?.role === "Communication Team" && (
        <section className="dashboard-two-column communication-operations-panel">

          <div className="dashboard-panel">
            <div className="dashboard-panel-heading compact">
              <div>
                <h2>Upcoming Communication Runs</h2>
                <p>Scheduled campaigns ready for communication execution.</p>
              </div>

              <button
                type="button"
                className="dashboard-link-button"
                onClick={() => {
                  window.location.href = "/delivery-tracking";
                }}
              >
                Delivery tracking
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="communication-run-list">
              {upcomingRuns.length ? (
                upcomingRuns.map((campaign, index) => (
                  <div
                    className="communication-run-row"
                    key={campaign.id || `${campaign.campaign_name || campaign.name}-${index}`}
                  >
                    <div className="communication-run-icon">
                      <Clock3 size={17} />
                    </div>

                    <div className="communication-run-content">
                      <div className="communication-run-title-row">
                        <strong>
                          {campaign.campaign_name || campaign.name || "Untitled campaign"}
                        </strong>
                        <span className="communication-run-status">
                          {campaign.status || "Scheduled"}
                        </span>
                      </div>
                      <span>{formatChannels(campaign.channels)}</span>
                    </div>

                    <div className="communication-run-time">
                      <small>Next run</small>
                      <strong>{formatSchedule(campaign.schedule)}</strong>
                    </div>
                  </div>
                ))
              ) : (
                <div className="communication-empty-state">
                  <Clock3 size={24} />
                  <strong>No upcoming communication runs</strong>
                  <span>Approved or scheduled campaigns will appear here.</span>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="dashboard-panel-heading compact">
              <div>
                <h2>Operations at a Glance</h2>
                <p>Priority items for the communication team.</p>
              </div>
              <AlertTriangle size={22} className="panel-heading-icon" />
            </div>

            <div className="communication-alert-list">
              {communicationAlerts.map((alert, index) => {
                const Icon = alert.icon;
                const toneClass =
                  alert.tone === "red"
                    ? "communication-alert-red"
                    : alert.tone === "orange"
                      ? "communication-alert-orange"
                      : alert.tone === "green"
                        ? "communication-alert-green"
                        : "communication-alert-blue";

                return (
                  <button
                    type="button"
                    className={`communication-alert-row ${toneClass}`}
                    key={`${alert.title}-${index}`}
                    onClick={() => {
                      window.location.href = alert.path;
                    }}
                  >
                    <span className="communication-alert-icon">
                      <Icon size={18} />
                    </span>
                    <span className="communication-alert-copy">
                      <strong>{alert.title}</strong>
                      <span>{alert.description}</span>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                );
              })}
            </div>

            <div className="communication-activity-divider" />

            <div className="communication-activity-heading">
              <div>
                <span>RECENT ACTIVITY</span>
                <strong>Latest campaign operations</strong>
              </div>
              <button
                type="button"
                className="communication-inline-link"
                onClick={() => {
                  window.location.href = "/campaign";
                }}
              >
                View campaigns →
              </button>
            </div>

            <div className="communication-activity-list">
              {recentCommunicationActivity.length ? (
                recentCommunicationActivity.map((campaign, index) => (
                  <div
                    className="communication-activity-row"
                    key={campaign.id || `${campaign.campaign_name || campaign.name}-activity-${index}`}
                  >
                    <div>
                      <strong>
                        {campaign.campaign_name || campaign.name || "Campaign"}
                      </strong>
                      <span>{formatChannels(campaign.channels)}</span>
                    </div>
                    <span
                      className={`communication-activity-status ${
                        String(campaign.status || "").toLowerCase() === "failed"
                          ? "failed"
                          : String(campaign.status || "").toLowerCase() === "completed"
                            ? "completed"
                            : "active"
                      }`}
                    >
                      {campaign.status || "Active"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="communication-activity-empty">
                  Campaign activity will appear here after execution begins.
                </div>
              )}
            </div>
          </div>
        </section>
      )}


      {/* =====================================================
          FOOTER SUMMARY
          ===================================================== */}

      <section className="dashboard-footer-stats">


        <div>

          <MessageSquareText
            size={18}
          />


          <span>
            Templates
          </span>


          <strong>

            {formatNumber(
              templates
            )}

          </strong>

        </div>


        <div>

          <Users
            size={18}
          />


          <span>
            Registered Users
          </span>


          <strong>

            {formatNumber(
              users
            )}

          </strong>

        </div>


        <div>

          <CheckCircle2
            size={18}
          />


          <span>
            Completed
          </span>


          <strong>

            {campaignStatus.completed ||
              0}

          </strong>

        </div>


        <div>

          <Send
            size={18}
          />


          <span>
            Delivery
          </span>


          <strong>
            98.4%
          </strong>

        </div>


      </section>


    </div>

  );

}