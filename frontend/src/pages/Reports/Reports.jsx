import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Download,
  FileBarChart,
  FileText,
  Mail,
  Megaphone,
  RefreshCw,
  Send,
  Target,
  Users,
  XCircle,
  Clock3,
  TrendingUp,
  Layers3,
  ArrowRight,
} from "lucide-react";

import toast from "react-hot-toast";

import dashboardService from "../../services/dashboardService";
import campaignService from "../../services/campaignService";
import deliveryService from "../../services/deliveryService";

// ============================================================
// HELPERS
// ============================================================

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatNumber = (value) => toNumber(value).toLocaleString("en-IN");

const formatPercent = (value) => `${toNumber(value).toFixed(1)}%`;

const getCampaignStatusValue = (status, keys) => {
  for (const key of keys) {
    if (status && status[key] !== undefined && status[key] !== null) {
      return toNumber(status[key]);
    }
  }
  return 0;
};

// ============================================================
// STATUS CONFIG
// ============================================================

const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700",
    dot: "bg-slate-500",
  },
  pending: {
    label: "Pending Review",
    className: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    className: "bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-violet-50 text-violet-700",
    dot: "bg-violet-500",
  },
  sending: {
    label: "Sending",
    className: "bg-orange-50 text-orange-700",
    dot: "bg-orange-500",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
};

// ============================================================
// SHARED CARD
// ============================================================

function SectionCard({ children, className = "" }) {
  return (
    <section
      className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function SectionHeader({ icon: Icon, title, description, iconClass = "bg-blue-50 text-blue-600" }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon size={19} />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[#07152f]">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// KPI CARD
// ============================================================

function KpiCard({ icon: Icon, title, value, subtitle, iconClass, accent = "bg-slate-50" }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${accent} transition group-hover:scale-125`} />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[#07152f]">{value}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">{subtitle}</p>
        </div>

        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PERFORMANCE CARD
// ============================================================

function PerformanceCard({ title, value, description, icon: Icon, tone }) {
  const tones = {
    blue: {
      wrapper: "border-blue-100 bg-blue-50/60",
      icon: "bg-blue-100 text-blue-600",
      bar: "bg-blue-600",
    },
    green: {
      wrapper: "border-emerald-100 bg-emerald-50/60",
      icon: "bg-emerald-100 text-emerald-600",
      bar: "bg-emerald-500",
    },
    orange: {
      wrapper: "border-orange-100 bg-orange-50/60",
      icon: "bg-orange-100 text-orange-600",
      bar: "bg-orange-500",
    },
    red: {
      wrapper: "border-red-100 bg-red-50/60",
      icon: "bg-red-100 text-red-600",
      bar: "bg-red-500",
    },
  };

  const selected = tones[tone] || tones.blue;
  const numericValue = Math.max(0, Math.min(100, toNumber(value)));

  return (
    <div className={`rounded-2xl border p-5 ${selected.wrapper}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-[#07152f]">{formatPercent(value)}</p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${selected.icon}`}>
          <Icon size={19} />
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white">
        <div
          className={`h-full rounded-full transition-all duration-500 ${selected.bar}`}
          style={{ width: `${numericValue}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// HERO METRIC
// ============================================================

function HeroMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
      <p className="text-[11px] font-medium uppercase tracking-wider text-blue-100/60">{label}</p>
      <p className="mt-1 text-xl font-bold">{formatNumber(value)}</p>
    </div>
  );
}

// ============================================================
// SNAPSHOT
// ============================================================

function Snapshot({ label, value, icon: Icon, className }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-slate-200 hover:bg-white">
      <div className="flex items-center justify-between gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${className}`}>
          <Icon size={17} />
        </div>
        <span className="text-xl font-bold text-[#07152f]">{formatNumber(value)}</span>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

// ============================================================
// STATUS ROW
// ============================================================

function StatusRow({ label, value, config, total }) {
  const percentage = total > 0 ? Math.min(100, (value / total) * 100) : 0;

  return (
    <div className="py-3">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
          <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
        <span className="text-sm font-bold text-[#07152f]">{formatNumber(value)}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${config.dot}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

// ============================================================
// CHANNEL ROW
// ============================================================

function ChannelRow({ name, sent, delivered, failed }) {
  const total = sent + delivered + failed;
  const rate = total > 0 ? (delivered / total) * 100 : 0;

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-slate-200 hover:bg-white hover:shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <Mail size={18} />
          </div>
          <div>
            <p className="text-sm font-bold capitalize text-[#07152f]">{name.replaceAll("_", " ")}</p>
            <p className="text-xs text-slate-400">{formatNumber(total)} total attempts</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-5 text-right">
          <div>
            <p className="text-[11px] text-slate-400">Sent</p>
            <p className="mt-1 text-sm font-bold text-blue-700">{formatNumber(sent)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Delivered</p>
            <p className="mt-1 text-sm font-bold text-emerald-600">{formatNumber(delivered)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Failed</p>
            <p className="mt-1 text-sm font-bold text-red-600">{formatNumber(failed)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Rate</p>
            <p className="mt-1 text-sm font-bold text-[#07152f]">{formatPercent(rate)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, rate)}%` }} />
      </div>
    </div>
  );
}

// ============================================================
// PIPELINE ITEM
// ============================================================

function PipelineItem({ label, value, icon: Icon, className }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-slate-200 hover:bg-white">
      <div className="flex items-center justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${className}`}>
          <Icon size={19} />
        </div>
        <span className="text-2xl font-bold text-[#07152f]">{formatNumber(value)}</span>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-600">{label}</p>
    </div>
  );
}

// ============================================================
// CAMPAIGN TABLE
// ============================================================

function CampaignTable({ campaigns, onExport }) {
  return (
    <SectionCard className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-6 md:flex-row md:items-center md:justify-between">
        <SectionHeader
          icon={FileText}
          title="Campaign Report"
          description={`${formatNumber(campaigns.length)} campaigns available in the workspace.`}
        />

        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live data
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-4 font-semibold">Campaign</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Channel</th>
              <th className="px-6 py-4 font-semibold">Created</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {campaigns.length > 0 ? (
              campaigns.slice(0, 12).map((campaign) => {
                const rawStatus = String(campaign.status || "Draft").toLowerCase();
                const normalizedStatus =
                  rawStatus === "pending review" ? "pending" : rawStatus.replaceAll(" ", "_");
                const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.draft;
                const channel =
                  campaign.channel ||
                  campaign.channels ||
                  campaign.communication_channel ||
                  "—";

                return (
                  <tr key={campaign.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <Megaphone size={16} />
                        </div>
                        <div>
                          <p className="max-w-[320px] truncate text-sm font-bold text-[#07152f]">
                            {campaign.campaign_name || campaign.name || `Campaign #${campaign.id}`}
                          </p>
                          <p className="text-xs text-slate-400">ID #{campaign.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${config.className}`}>
                        {config.label}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm font-medium capitalize text-slate-600">
                      {String(channel).replaceAll("_", " ")}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {campaign.created_at
                        ? new Date(campaign.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-14 text-center">
                  <FileText size={32} className="mx-auto text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-600">No campaigns available</p>
                  <p className="mt-1 text-xs text-slate-400">Create a campaign to populate this report.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
        <p className="text-xs text-slate-400">Showing up to 12 recent campaigns.</p>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 transition hover:text-blue-700"
        >
          <Download size={14} />
          Export data
        </button>
      </div>
    </SectionCard>
  );
}

// ============================================================
// REPORTS PAGE
// ============================================================

export default function Reports() {
  const [dashboard, setDashboard] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState("overview");

  // ============================================================
  // LOAD REPORT DATA
  // ============================================================

  const loadReports = useCallback(async (initial = false) => {
    try {
      if (initial) setLoading(true);
      else setRefreshing(true);

      const [dashboardData, deliveryData, campaignData] = await Promise.all([
        dashboardService.getDashboard(),
        deliveryService.getAnalytics(),
        campaignService.getAll(),
      ]);

      setDashboard(dashboardData || {});
      setDelivery(deliveryData || {});

      if (Array.isArray(campaignData)) {
        setCampaigns(campaignData);
      } else if (Array.isArray(campaignData?.campaigns)) {
        setCampaigns(campaignData.campaigns);
      } else {
        setCampaigns([]);
      }
    } catch (error) {
      console.error("REPORTS LOAD ERROR:", error);
      toast.error(error?.response?.data?.detail || "Unable to load reports.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
  const timer = setTimeout(() => {
    void loadReports(true);
  }, 0);

  return () => clearTimeout(timer);
}, [loadReports]);

  // ============================================================
  // REAL DATA
  // ============================================================

  const users = toNumber(dashboard?.users);
  const audiences = toNumber(dashboard?.audience);
  const campaignCount = toNumber(dashboard?.campaigns);
  const templates = toNumber(dashboard?.templates);

  const total = toNumber(
    delivery?.total_messages ?? delivery?.total ?? delivery?.total_attempts
  );
  const sent = toNumber(delivery?.sent);
  const delivered = toNumber(delivery?.delivered);
  const failed = toNumber(delivery?.failed);
  const queued = toNumber(delivery?.queued);
  const sending = toNumber(delivery?.sending);

  // Read / opened / clicked / retrying are intentionally not used here.
  // The Reports page is focused on communication delivery performance.

  // ============================================================
  // CALCULATED RATES
  // ============================================================

  const deliveryRate = toNumber(
    delivery?.delivery_rate ?? (total > 0 ? (delivered / total) * 100 : 0)
  );

  const sentRate = toNumber(
    delivery?.sent_rate ?? (total > 0 ? (sent / total) * 100 : 0)
  );

  const failureRate = toNumber(
    delivery?.failure_rate ?? (total > 0 ? (failed / total) * 100 : 0)
  );

  // ============================================================
// CAMPAIGN STATUS
// ============================================================

const campaignStatus = useMemo(() => {
  // ----------------------------------------------------------
  // Use campaign status data from delivery analytics when
  // the backend provides it.
  // ----------------------------------------------------------

  if (
    delivery?.campaign_status &&
    typeof delivery.campaign_status === "object"
  ) {
    return delivery.campaign_status;
  }

  if (
    delivery?.campaignStatus &&
    typeof delivery.campaignStatus === "object"
  ) {
    return delivery.campaignStatus;
  }

  // ----------------------------------------------------------
  // Otherwise calculate campaign status counts directly
  // from the campaigns returned by the backend.
  // ----------------------------------------------------------

  const statusCounts = {
    draft: 0,
    pending: 0,
    approved: 0,
    scheduled: 0,
    sending: 0,
    completed: 0,
    rejected: 0,
  };

  if (Array.isArray(campaigns)) {
    campaigns.forEach((campaign) => {
      const rawStatus = String(
        campaign?.status || "draft"
      )
        .trim()
        .toLowerCase()
        .replaceAll("-", "_")
        .replaceAll(" ", "_");

      if (
        rawStatus === "pending_review" ||
        rawStatus === "pending"
      ) {
        statusCounts.pending += 1;
        return;
      }

      if (statusCounts[rawStatus] !== undefined) {
        statusCounts[rawStatus] += 1;
      }
    });
  }

  return statusCounts;
}, [
  delivery?.campaign_status,
  delivery?.campaignStatus,
  campaigns,
]);
  const statusRows = useMemo(
    () => [
      { key: "draft", value: getCampaignStatusValue(campaignStatus, ["draft"]) },
      {
        key: "pending",
        value: getCampaignStatusValue(campaignStatus, ["pending", "pending_review"]),
      },
      { key: "approved", value: getCampaignStatusValue(campaignStatus, ["approved"]) },
      { key: "scheduled", value: getCampaignStatusValue(campaignStatus, ["scheduled"]) },
      { key: "sending", value: getCampaignStatusValue(campaignStatus, ["sending"]) },
      { key: "completed", value: getCampaignStatusValue(campaignStatus, ["completed"]) },
      { key: "rejected", value: getCampaignStatusValue(campaignStatus, ["rejected"]) },
    ],
    [campaignStatus]
  );

  // ============================================================
  // CHANNEL DATA
  // ============================================================

  const channelData = useMemo(() => {
    const source = delivery?.by_channel || delivery?.channels || {};

    return Object.entries(source).map(([channel, data]) => ({
      channel,
      sent: toNumber(data?.sent),
      delivered: toNumber(data?.delivered),
      failed: toNumber(data?.failed),
    }));
  }, [delivery]);

  // ============================================================
  // EXPORT REPORT
  // ============================================================

  const exportReport = () => {
    try {
      const rows = [
        ["SmartNotify Report", ""],
        ["Generated", new Date().toLocaleString("en-IN")],
        [],
        ["Platform Summary", ""],
        ["Total Users", users],
        ["Audiences", audiences],
        ["Campaigns", campaignCount],
        ["Templates", templates],
        [],
        ["Delivery Performance", ""],
        ["Total Attempts", total],
        ["Sent", sent],
        ["Delivered", delivered],
        ["Failed", failed],
        ["Queued", queued],
        ["Sending", sending],
        [],
        ["Rates", ""],
        ["Delivery Rate", formatPercent(deliveryRate)],
        ["Sent Rate", formatPercent(sentRate)],
        ["Failure Rate", formatPercent(failureRate)],
        [],
        ["Campaign Status", "Count"],
        ...statusRows.map((item) => [STATUS_CONFIG[item.key].label, item.value]),
      ];

      const csv = rows
        .map((row) =>
          row
            .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `smartnotify-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Report exported successfully.");
    } catch (error) {
      console.error("REPORT EXPORT ERROR:", error);
      toast.error("Unable to export report.");
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-full bg-[#f5f8fc] px-5 py-8 md:px-8">
        <div className="mx-auto flex min-h-[600px] max-w-[1450px] items-center justify-center">
          <div className="text-center">
            <RefreshCw size={34} className="mx-auto animate-spin text-blue-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Preparing your reports...</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="min-h-full bg-[#f5f8fc] px-5 py-7 md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1450px]">
        {/* HEADER */}
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100">
                <FileBarChart size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                  SmartNotify Intelligence
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-[#07152f] md:text-4xl">Reports</h1>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Understand campaign performance, delivery activity and communication health from one reporting workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
              <Activity size={16} className="text-emerald-500" />
              All-time live data
            </div>

            <button
              type="button"
              onClick={() => loadReports(false)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              type="button"
              onClick={exportReport}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 hover:shadow-xl"
            >
              <Download size={17} />
              Export Report
            </button>
          </div>
        </div>

        {/* VIEW SWITCHER */}
        <div className="mb-7 flex w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-sm sm:w-fit">
          {[
            ["overview", "Overview"],
            ["delivery", "Delivery"],
            ["campaigns", "Campaigns"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedView(key)}
              className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                selectedView === key
                  ? "bg-[#07152f] text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ====================================================
            OVERVIEW
        ==================================================== */}
        {selectedView === "overview" && (
          <>
            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                icon={Users}
                title="Total Users"
                value={formatNumber(users)}
                subtitle="Registered users"
                iconClass="bg-violet-50 text-violet-600"
                accent="bg-violet-50"
              />
              <KpiCard
                icon={Target}
                title="Audiences"
                value={formatNumber(audiences)}
                subtitle="Target groups"
                iconClass="bg-blue-50 text-blue-600"
                accent="bg-blue-50"
              />
              <KpiCard
                icon={Megaphone}
                title="Campaigns"
                value={formatNumber(campaignCount)}
                subtitle="Created campaigns"
                iconClass="bg-emerald-50 text-emerald-600"
                accent="bg-emerald-50"
              />
              <KpiCard
                icon={Layers3}
                title="Templates"
                value={formatNumber(templates)}
                subtitle="Message templates"
                iconClass="bg-orange-50 text-orange-600"
                accent="bg-orange-50"
              />
            </div>

            <div className="mb-7 grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_1fr]">
              <div className="relative overflow-hidden rounded-3xl bg-[#07152f] p-7 text-white shadow-xl">
                <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20" />
                <div className="absolute -bottom-28 right-32 h-72 w-72 rounded-full bg-violet-500/10" />

                <div className="relative">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
                        <Activity size={14} />
                        Overall delivery performance
                      </div>
                      <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
                        {formatPercent(deliveryRate)}
                      </h2>
                      <p className="mt-2 text-sm text-blue-100/70">
                        Delivered messages compared with total delivery attempts.
                      </p>
                    </div>

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                      <TrendingUp size={27} />
                    </div>
                  </div>

                  <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-500"
                      style={{ width: `${Math.min(100, deliveryRate)}%` }}
                    />
                  </div>

                  <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <HeroMetric label="Attempts" value={total} />
                    <HeroMetric label="Sent" value={sent} />
                    <HeroMetric label="Delivered" value={delivered} />
                    <HeroMetric label="Failed" value={failed} />
                  </div>
                </div>
              </div>

              <SectionCard className="p-7">
                <SectionHeader
                  icon={BarChart3}
                  title="Delivery snapshot"
                  description="Current delivery state"
                />

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <Snapshot label="Sent" value={sent} icon={Send} className="bg-blue-50 text-blue-600" />
                  <Snapshot label="Delivered" value={delivered} icon={CheckCircle2} className="bg-emerald-50 text-emerald-600" />
                  <Snapshot label="Failed" value={failed} icon={XCircle} className="bg-red-50 text-red-600" />
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Delivery health</span>
                    <span className="text-xs font-bold text-emerald-600">{formatPercent(deliveryRate)}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, deliveryRate)}%` }}
                    />
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <PerformanceCard
                title="Delivery Rate"
                value={deliveryRate}
                description="Successfully delivered"
                icon={CheckCircle2}
                tone="green"
              />
              <PerformanceCard
                title="Sent Rate"
                value={sentRate}
                description="Accepted / sent messages"
                icon={Send}
                tone="blue"
              />
              <PerformanceCard
                title="Failure Rate"
                value={failureRate}
                description="Messages that failed"
                icon={AlertCircle}
                tone="red"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <SectionCard className="p-6">
                <SectionHeader
                  icon={Megaphone}
                  title="Campaign Distribution"
                  description="Campaigns grouped by workflow stage."
                  iconClass="bg-violet-50 text-violet-600"
                />
                <div className="mt-5 space-y-1">
                  {statusRows.map((item) => {
                    const config = STATUS_CONFIG[item.key];
                    return (
                      <StatusRow
                        key={item.key}
                        label={config.label}
                        value={item.value}
                        config={config}
                        total={campaignCount}
                      />
                    );
                  })}
                </div>
              </SectionCard>

              <SectionCard className="p-6">
                <SectionHeader
                  icon={Activity}
                  title="Delivery Pipeline"
                  description="Current state of communication attempts."
                />
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <PipelineItem label="Queued" value={queued} icon={Clock3} className="bg-violet-50 text-violet-600" />
                  <PipelineItem label="Sending" value={sending} icon={Send} className="bg-orange-50 text-orange-600" />
                  <PipelineItem label="Sent" value={sent} icon={Send} className="bg-blue-50 text-blue-600" />
                  <PipelineItem label="Delivered" value={delivered} icon={CheckCircle2} className="bg-emerald-50 text-emerald-600" />
                  <PipelineItem label="Failed" value={failed} icon={XCircle} className="bg-red-50 text-red-600 sm:col-span-2" />
                </div>
              </SectionCard>
            </div>
          </>
        )}

        {/* ====================================================
            DELIVERY
        ==================================================== */}
        {selectedView === "delivery" && (
          <>
            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <KpiCard
                icon={Send}
                title="Sent"
                value={formatNumber(sent)}
                subtitle="Messages accepted for delivery"
                iconClass="bg-blue-50 text-blue-600"
                accent="bg-blue-50"
              />
              <KpiCard
                icon={CheckCircle2}
                title="Delivered"
                value={formatNumber(delivered)}
                subtitle="Successfully delivered"
                iconClass="bg-emerald-50 text-emerald-600"
                accent="bg-emerald-50"
              />
              <KpiCard
                icon={XCircle}
                title="Failed"
                value={formatNumber(failed)}
                subtitle="Delivery failures"
                iconClass="bg-red-50 text-red-600"
                accent="bg-red-50"
              />
            </div>

            <div className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-3">
              <PerformanceCard title="Delivery Rate" value={deliveryRate} description="Successfully delivered" icon={CheckCircle2} tone="green" />
              <PerformanceCard title="Sent Rate" value={sentRate} description="Accepted / sent messages" icon={Send} tone="blue" />
              <PerformanceCard title="Failure Rate" value={failureRate} description="Messages that failed" icon={AlertCircle} tone="red" />
            </div>

            <div className="mb-7 grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_1fr]">
              <SectionCard className="p-6">
                <SectionHeader
                  icon={Mail}
                  title="Channel Performance"
                  description="Delivery activity across communication channels."
                />

                <div className="mt-6 space-y-3">
                  {channelData.length > 0 ? (
                    channelData.map((channel) => (
                      <ChannelRow
                        key={channel.channel}
                        name={channel.channel}
                        sent={channel.sent}
                        delivered={channel.delivered}
                        failed={channel.failed}
                      />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                      <Mail size={30} className="mx-auto text-slate-300" />
                      <p className="mt-3 text-sm font-semibold text-slate-600">Channel breakdown unavailable</p>
                      <p className="mt-1 text-xs text-slate-400">Aggregate delivery information is currently available.</p>
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard className="p-6">
                <SectionHeader
                  icon={Activity}
                  title="Delivery Pipeline"
                  description="Track communication attempts through the delivery flow."
                />

                <div className="mt-6 space-y-3">
                  {[
                    ["Queued", queued, Clock3, "bg-violet-50 text-violet-600"],
                    ["Sending", sending, Send, "bg-orange-50 text-orange-600"],
                    ["Sent", sent, Send, "bg-blue-50 text-blue-600"],
                    ["Delivered", delivered, CheckCircle2, "bg-emerald-50 text-emerald-600"],
                  ].map(([label, value, Icon, className], index) => (
                    <div key={label}>
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${className}`}>
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sm font-semibold text-slate-700">{label}</span>
                            <span className="text-sm font-bold text-[#07152f]">{formatNumber(value)}</span>
                          </div>
                        </div>
                      </div>
                      {index < 3 && (
                        <div className="ml-5 flex h-5 items-center text-slate-300">
                          <ArrowRight size={15} className="rotate-90" />
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                          <XCircle size={18} />
                        </div>
                        <span className="text-sm font-semibold text-red-700">Failed</span>
                      </div>
                      <span className="text-sm font-bold text-red-700">{formatNumber(failed)}</span>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          </>
        )}

        {/* ====================================================
            CAMPAIGNS
        ==================================================== */}
        {selectedView === "campaigns" && (
          <>
            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                icon={Megaphone}
                title="Campaigns"
                value={formatNumber(campaignCount)}
                subtitle="Created campaigns"
                iconClass="bg-emerald-50 text-emerald-600"
                accent="bg-emerald-50"
              />
              <KpiCard
                icon={CheckCircle2}
                title="Completed"
                value={formatNumber(getCampaignStatusValue(campaignStatus, ["completed"]))}
                subtitle="Completed campaigns"
                iconClass="bg-blue-50 text-blue-600"
                accent="bg-blue-50"
              />
              <KpiCard
                icon={Clock3}
                title="Scheduled"
                value={formatNumber(getCampaignStatusValue(campaignStatus, ["scheduled"]))}
                subtitle="Scheduled campaigns"
                iconClass="bg-violet-50 text-violet-600"
                accent="bg-violet-50"
              />
              <KpiCard
                icon={AlertCircle}
                title="Rejected"
                value={formatNumber(getCampaignStatusValue(campaignStatus, ["rejected"]))}
                subtitle="Rejected campaigns"
                iconClass="bg-red-50 text-red-600"
                accent="bg-red-50"
              />
            </div>

            <div className="mb-7 grid grid-cols-1 gap-5 xl:grid-cols-[0.85fr_1.15fr]">
              <SectionCard className="p-6">
                <SectionHeader
                  icon={BarChart3}
                  title="Workflow overview"
                  description="Campaigns grouped by their current stage."
                />
                <div className="mt-5 space-y-1">
                  {statusRows.map((item) => {
                    const config = STATUS_CONFIG[item.key];
                    return (
                      <StatusRow
                        key={item.key}
                        label={config.label}
                        value={item.value}
                        config={config}
                        total={campaignCount}
                      />
                    );
                  })}
                </div>
              </SectionCard>

              <SectionCard className="p-6">
                <SectionHeader
                  icon={Activity}
                  title="Campaign health"
                  description="Delivery performance generated from current campaign activity."
                />

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-emerald-50 p-5">
                    <p className="text-xs font-semibold text-emerald-700">Delivered</p>
                    <p className="mt-2 text-2xl font-bold text-[#07152f]">{formatNumber(delivered)}</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-5">
                    <p className="text-xs font-semibold text-blue-700">Sent</p>
                    <p className="mt-2 text-2xl font-bold text-[#07152f]">{formatNumber(sent)}</p>
                  </div>
                  <div className="rounded-2xl bg-red-50 p-5">
                    <p className="text-xs font-semibold text-red-700">Failed</p>
                    <p className="mt-2 text-2xl font-bold text-[#07152f]">{formatNumber(failed)}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">Overall delivery rate</span>
                    <span className="text-sm font-bold text-emerald-600">{formatPercent(deliveryRate)}</span>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, deliveryRate)}%` }} />
                  </div>
                </div>
              </SectionCard>
            </div>

            <CampaignTable campaigns={campaigns} onExport={exportReport} />
          </>
        )}
      </div>
    </div>
  );
}
