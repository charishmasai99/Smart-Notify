import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleX,
  Clock3,
  Eye,
  FileText,
  Mail,
  Megaphone,
  MessageSquare,
  MousePointerClick,
  RefreshCw,
  Send,
  Smartphone,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
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

import toast from "react-hot-toast";

import dashboardService from "../../services/dashboardService";


// ============================================================
// CONSTANTS
// ============================================================

const CHART_COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
];

const CHANNEL_META = {
  email: {
    label: "Email",
    icon: Mail,
    tone: "blue",
  },
  sms: {
    label: "SMS",
    icon: Smartphone,
    tone: "violet",
  },
  whatsapp: {
    label: "WhatsApp",
    icon: MessageSquare,
    tone: "emerald",
  },
};

const WORKFLOW_META = [
  ["draft", "Draft", "slate"],
  ["pending_review", "Pending review", "amber"],
  ["approved", "Approved", "blue"],
  ["scheduled", "Scheduled", "violet"],
  ["sending", "Sending", "cyan"],
  ["completed", "Completed", "emerald"],
  ["rejected", "Rejected", "rose"],
];


// ============================================================
// SAFE NUMBER
// ============================================================

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}


// ============================================================
// PERCENTAGE
// ============================================================

function clampPercent(value) {
  return Math.max(
    0,
    Math.min(
      100,
      toNumber(value)
    )
  );
}


// ============================================================
// FORMAT NUMBER
// ============================================================

function formatNumber(value) {
  return toNumber(value).toLocaleString();
}


// ============================================================
// FORMAT PERCENT
// ============================================================

function formatPercent(value, digits = 1) {
  return `${clampPercent(value).toFixed(digits)}%`;
}


// ============================================================
// NORMALIZE DELIVERY CHANNEL DATA
// ============================================================

function normalizeChannels(delivery) {
  const source =
    delivery?.channels ||
    delivery?.by_channel ||
    {};

  if (!source || typeof source !== "object") {
    return [];
  }

  return Object.entries(source).map(
    ([channel, data]) => {
      const messages = toNumber(
        data?.messages ??
        data?.total ??
        0
      );

      const sent = toNumber(
        data?.sent ?? 0
      );

      const delivered = toNumber(
        data?.delivered ?? 0
      );

      const opened = toNumber(
        data?.opened ??
        data?.read ??
        0
      );

      const clicked = toNumber(
        data?.clicked ?? 0
      );

      const failed = toNumber(
        data?.failed ?? 0
      );

      const clicks = toNumber(
        data?.clicks ??
        data?.total_clicks ??
        0
      );

      const deliveryRate =
        data?.delivery_rate ??
        data?.deliveryRate ??
        (sent > 0
          ? (delivered / sent) * 100
          : 0);

      const readRate =
        data?.read_rate ??
        data?.open_rate ??
        data?.readRate ??
        (sent > 0
          ? (opened / sent) * 100
          : 0);

      const clickRate =
        data?.click_rate ??
        data?.clickRate ??
        (sent > 0
          ? (clicked / sent) * 100
          : 0);

      const failureRate =
        data?.failure_rate ??
        data?.failureRate ??
        (sent > 0
          ? (failed / sent) * 100
          : 0);

      return {
        channel,
        messages,
        sent,
        delivered,
        opened,
        clicked,
        failed,
        clicks,
        deliveryRate: toNumber(
          deliveryRate
        ),
        readRate: toNumber(
          readRate
        ),
        clickRate: toNumber(
          clickRate
        ),
        failureRate: toNumber(
          failureRate
        ),
      };
    }
  );
}


// ============================================================
// NORMALIZE CAMPAIGN DATA
// ============================================================

function normalizeCampaigns(delivery) {
  const source =
    delivery?.campaigns ||
    delivery?.by_campaign ||
    {};

  if (!source || typeof source !== "object") {
    return [];
  }

  return Object.entries(source).map(
    ([campaignId, data]) => {
      const messages = toNumber(
        data?.messages ??
        data?.total ??
        0
      );

      const sent = toNumber(
        data?.sent ?? 0
      );

      const delivered = toNumber(
        data?.delivered ?? 0
      );

      const opened = toNumber(
        data?.opened ??
        data?.read ??
        0
      );

      const clicked = toNumber(
        data?.clicked ?? 0
      );

      const failed = toNumber(
        data?.failed ?? 0
      );

      return {
        campaignId:
          data?.campaign_id ??
          campaignId,
        messages,
        sent,
        delivered,
        opened,
        clicked,
        failed,
        deliveryRate:
          sent > 0
            ? (delivered / sent) * 100
            : 0,
        readRate:
          sent > 0
            ? (opened / sent) * 100
            : 0,
        clickRate:
          sent > 0
            ? (clicked / sent) * 100
            : 0,
      };
    }
  );
}


// ============================================================
// KPI CARD
// ============================================================

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
  trend,
  trendLabel,
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  };

  const isPositive =
    toNumber(trend) >= 0;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-50 transition duration-300 group-hover:scale-125" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-[#07152f]">
            {formatNumber(value)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${tones[tone] || tones.blue}`}
        >
          <Icon size={21} />
        </div>
      </div>

      {trend !== undefined && (
        <div className="relative mt-4 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
          >
            {isPositive ? (
              <ArrowUpRight size={13} />
            ) : (
              <ArrowDownRight size={13} />
            )}
            {Math.abs(toNumber(trend)).toFixed(1)}%
          </span>

          <span className="text-[11px] text-slate-400">
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}


// ============================================================
// METRIC CARD
// ============================================================

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "blue",
}) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
  };

  const safe = clampPercent(value);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-[#07152f]">
            {formatPercent(value, 2)}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[tone] || toneClasses.blue}`}
        >
          <Icon size={19} />
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            tone === "emerald"
              ? "bg-emerald-500"
              : tone === "violet"
                ? "bg-violet-500"
                : tone === "rose"
                  ? "bg-rose-500"
                  : tone === "amber"
                    ? "bg-amber-500"
                    : "bg-blue-500"
          }`}
          style={{
            width: `${safe}%`,
          }}
        />
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}


// ============================================================
// PIPELINE CARD
// ============================================================

function PipelineCard({
  label,
  value,
  icon: Icon,
  tone,
}) {
  const classes = {
    slate: "bg-slate-50 text-slate-600",
    blue: "bg-blue-50 text-blue-600",
    cyan: "bg-cyan-50 text-cyan-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${classes[tone] || classes.blue}`}
        >
          <Icon size={18} />
        </div>

        <span className="text-2xl font-bold text-[#07152f]">
          {formatNumber(value)}
        </span>
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-500">
        {label}
      </p>
    </div>
  );
}


// ============================================================
// CHANNEL ICON
// ============================================================

function ChannelIcon({ channel }) {
  const key = String(
    channel || ""
  ).toLowerCase();

  const meta =
    CHANNEL_META[key] || {
      label: channel || "Channel",
      icon: Send,
      tone: "blue",
    };

  const Icon = meta.icon;

  const tones = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div
      className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[meta.tone] || tones.blue}`}
      title={meta.label}
    >
      <Icon size={20} />
    </div>
  );
}


// ============================================================
// CHANNEL PERFORMANCE CARD
// ============================================================

function ChannelPerformanceCard({ channel }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ChannelIcon channel={channel.channel} />

          <div>
            <h3 className="font-bold capitalize text-[#07152f]">
              {channel.channel || "Unknown"}
            </h3>
            <p className="text-xs text-slate-500">
              {formatNumber(channel.messages)} messages
            </p>
          </div>
        </div>

        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
          {formatPercent(channel.deliveryRate)} delivered
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <MiniMetric
          label="Sent"
          value={channel.sent}
        />
        <MiniMetric
          label="Read"
          value={channel.opened}
        />
        <MiniMetric
          label="Failed"
          value={channel.failed}
        />
      </div>

      <div className="mt-5 space-y-3">
        <ProgressLine
          label="Delivery"
          value={channel.deliveryRate}
          tone="emerald"
        />
        <ProgressLine
          label="Read"
          value={channel.readRate}
          tone="blue"
        />
        <ProgressLine
          label="Click"
          value={channel.clickRate}
          tone="violet"
        />
        <ProgressLine
          label="Failure"
          value={channel.failureRate}
          tone="rose"
        />
      </div>
    </div>
  );
}


// ============================================================
// MINI METRIC
// ============================================================

function MiniMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-[#07152f]">
        {formatNumber(value)}
      </p>
    </div>
  );
}


// ============================================================
// PROGRESS LINE
// ============================================================

function ProgressLine({
  label,
  value,
  tone = "blue",
}) {
  const safe = clampPercent(value);

  const bars = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    violet: "bg-violet-500",
    rose: "bg-rose-500",
    amber: "bg-amber-500",
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-500">
          {label}
        </span>
        <span className="font-bold text-slate-700">
          {formatPercent(value)}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${bars[tone] || bars.blue}`}
          style={{
            width: `${safe}%`,
          }}
        />
      </div>
    </div>
  );
}


// ============================================================
// WORKFLOW CARD
// ============================================================

function WorkflowCard({
  name,
  value,
  tone,
}) {
  const classes = {
    slate: "bg-slate-50 text-slate-600 ring-slate-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
    cyan: "bg-cyan-50 text-cyan-600 ring-cyan-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    rose: "bg-rose-50 text-rose-600 ring-rose-100",
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`h-2.5 w-2.5 rounded-full ${
            tone === "emerald"
              ? "bg-emerald-500"
              : tone === "rose"
                ? "bg-rose-500"
                : tone === "amber"
                  ? "bg-amber-500"
                  : tone === "violet"
                    ? "bg-violet-500"
                    : tone === "cyan"
                      ? "bg-cyan-500"
                      : "bg-blue-500"
          }`}
        />
        <span className="text-sm font-semibold text-slate-600">
          {name}
        </span>
      </div>

      <span
        className={`rounded-lg px-2.5 py-1 text-sm font-bold ring-1 ${classes[tone] || classes.blue}`}
      >
        {formatNumber(value)}
      </span>
    </div>
  );
}


// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  title,
  description,
  icon: Icon = BarChart3,
}) {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 text-center">
      <div>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
          <Icon size={23} />
        </div>
        <h3 className="mt-4 font-bold text-[#07152f]">
          {title}
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}


// ============================================================
// TOOLTIP STYLE
// ============================================================

function ChartTooltip({
  active,
  payload,
  label,
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-xl">
      {label && (
        <p className="mb-1 text-xs font-semibold text-slate-500">
          {label}
        </p>
      )}

      {payload.map((item) => (
        <div
          key={`${item.name}-${item.value}`}
          className="flex items-center justify-between gap-6 text-xs"
        >
          <span className="text-slate-500">
            {item.name}
          </span>
          <span className="font-bold text-[#07152f]">
            {formatNumber(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}


// ============================================================
// ANALYTICS PAGE
// ============================================================

export default function Analytics() {
  const [dashboard, setDashboard] =
    useState(null);

  const [delivery, setDelivery] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const loadAnalytics = useCallback(
    async (showInitialLoader = false) => {
      try {
        if (showInitialLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const [
          dashboardData,
          deliveryData,
        ] = await Promise.all([
          dashboardService.getDashboard(),
          dashboardService.getDeliveryAnalytics(),
        ]);

        setDashboard(dashboardData);
        setDelivery(deliveryData);
      } catch (error) {
        console.error(
          "Analytics error:",
          error
        );

        toast.error(
          error?.response?.data?.detail ||
          "Failed to load analytics"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    const fetchInitialData = async () => {
      try {
        const [
          dashboardData,
          deliveryData,
        ] = await Promise.all([
          dashboardService.getDashboard(),
          dashboardService.getDeliveryAnalytics(),
        ]);

        if (cancelled) {
          return;
        }

        setDashboard(dashboardData);
        setDelivery(deliveryData);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Analytics error:",
          error
        );

        toast.error(
          error?.response?.data?.detail ||
          "Failed to load analytics"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    const users = toNumber(
      dashboard?.users
    );

    const audiences = toNumber(
      dashboard?.audience
    );

    const campaigns = toNumber(
      dashboard?.campaigns
    );

    const templates = toNumber(
      dashboard?.templates
    );

    const total = toNumber(
      delivery?.total_messages ??
      delivery?.total ??
      delivery?.delivery?.total
    );

    const queued = toNumber(
      delivery?.queued
    );

    const sending = toNumber(
      delivery?.sending
    );

    const sent = toNumber(
      delivery?.sent
    );

    const delivered = toNumber(
      delivery?.delivered
    );

    const read = toNumber(
      delivery?.opened ??
      delivery?.read
    );

    const clicked = toNumber(
      delivery?.clicked
    );

    const failed = toNumber(
      delivery?.failed
    );

    const retrying = toNumber(
      delivery?.retrying
    );

    const deliveryRate = toNumber(
      delivery?.delivery_rate
    );

    const readRate = toNumber(
      delivery?.open_rate ??
      delivery?.read_rate
    );

    const clickRate = toNumber(
      delivery?.click_rate
    );

    const failureRate = toNumber(
      delivery?.failure_rate
    );

    const engagementRate = toNumber(
      delivery?.engagement_rate
    );

    const totalClicks = toNumber(
      delivery?.total_clicks
    );

    const effectiveTotal =
      total > 0
        ? total
        : sent + failed + queued + retrying;

    return {
      users,
      audiences,
      campaigns,
      templates,
      total: effectiveTotal,
      queued,
      sending,
      sent,
      delivered,
      read,
      clicked,
      failed,
      retrying,
      deliveryRate,
      readRate,
      clickRate,
      failureRate,
      engagementRate,
      totalClicks,
    };
  }, [dashboard, delivery]);

  const channels = useMemo(
    () => normalizeChannels(delivery),
    [delivery]
  );

  const campaignRows = useMemo(
    () => normalizeCampaigns(delivery),
    [delivery]
  );

  const deliveryChartData = useMemo(
    () => [
      {
        name: "Delivered",
        value: metrics.delivered,
      },
      {
        name: "Sent",
        value: Math.max(
          metrics.sent -
            metrics.delivered,
          0
        ),
      },
      {
        name: "Read",
        value: metrics.read,
      },
      {
        name: "Failed",
        value: metrics.failed,
      },
      {
        name: "Retrying",
        value: metrics.retrying,
      },
      {
        name: "Queued",
        value: metrics.queued,
      },
    ].filter(
      (item) => item.value > 0
    ),
    [metrics]
  );

  const engagementData = useMemo(
    () => [
      {
        stage: "Sent",
        value: metrics.sent,
      },
      {
        stage: "Delivered",
        value: metrics.delivered,
      },
      {
        stage: "Read",
        value: metrics.read,
      },
      {
        stage: "Clicked",
        value: metrics.clicked,
      },
    ],
    [metrics]
  );

  const channelRanking = useMemo(
    () =>
      [...channels].sort(
        (a, b) =>
          b.readRate - a.readRate
      ),
    [channels]
  );

  const campaignWorkflow = useMemo(() => {
    const status =
      dashboard?.campaign_status ||
      {};

    return WORKFLOW_META.map(
      ([key, label, tone]) => ({
        key,
        label,
        tone,
        value: toNumber(
          status[key]
        ),
      })
    );
  }, [dashboard]);

  

  const channelVolumeData = useMemo(
    () =>
      channels.map((item) => ({
        channel: item.channel,
        Sent: item.sent,
        Delivered: item.delivered,
        Failed: item.failed,
      })),
    [channels]
  );

  const handleRefresh = () => {
    if (refreshing) {
      return;
    }

    loadAnalytics(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] px-5 py-7 md:px-8 lg:px-10">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-7 h-28 animate-pulse rounded-3xl bg-white ring-1 ring-slate-200" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200"
                />
              )
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_0.8fr]">
            <div className="h-[430px] animate-pulse rounded-3xl bg-white ring-1 ring-slate-200" />
            <div className="h-[430px] animate-pulse rounded-3xl bg-white ring-1 ring-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] px-5 py-7 md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        {/* ==================================================
            HEADER
        ================================================== */}
        <header className="mb-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="relative px-6 py-6 md:px-8 md:py-7">
            <div className="absolute -right-16 -top-24 h-56 w-56 rounded-full bg-blue-50" />
            <div className="absolute right-28 -bottom-32 h-56 w-56 rounded-full bg-violet-50" />

            <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#07152f] text-white shadow-lg shadow-slate-200">
                    <BarChart3 size={23} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold tracking-tight text-[#07152f] md:text-3xl">
                        Analytics Command Center
                      </h1>
                      <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 sm:inline-flex">
                        Live data
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      A complete view of communication delivery, engagement and campaign health.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
                    <Activity size={13} className="text-blue-600" />
                    Delivery monitoring
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
                    <Target size={13} className="text-violet-600" />
                    Engagement intelligence
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
                    <Zap size={13} className="text-amber-500" />
                    Operational health
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#07152f] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={17}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />
                {refreshing
                  ? "Refreshing..."
                  : "Refresh data"}
              </button>
            </div>
          </div>
        </header>

        {/* ==================================================
            KPI OVERVIEW
        ================================================== */}
        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Total users"
            value={metrics.users}
            subtitle="Registered workspace users"
            icon={Users}
            tone="blue"
          />

          <KpiCard
            title="Audiences"
            value={metrics.audiences}
            subtitle="Available target groups"
            icon={Target}
            tone="violet"
          />

          <KpiCard
            title="Campaigns"
            value={metrics.campaigns}
            subtitle="Campaigns created"
            icon={Megaphone}
            tone="amber"
          />

          <KpiCard
            title="Templates"
            value={metrics.templates}
            subtitle="Reusable message templates"
            icon={FileText}
            tone="emerald"
          />
        </section>

        {/* ==================================================
            PERFORMANCE HERO
        ================================================== */}
        <section className="mb-7 grid grid-cols-1 gap-6 xl:grid-cols-[1.55fr_0.75fr]">
          <div className="relative overflow-hidden rounded-3xl bg-[#07152f] p-6 text-white shadow-xl shadow-slate-200 md:p-8">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/10" />
            <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-violet-500/10" />

            <div className="relative">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
                    <TrendingUp size={14} />
                    Communication performance
                  </div>

                  <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                    {formatPercent(metrics.deliveryRate, 2)}
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                    Delivery success across the communication attempts currently recorded by SmartNotify.
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                  <Activity size={22} className="text-blue-200" />
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
                  <span>Delivered</span>
                  <span className="font-semibold text-white">
                    {formatNumber(metrics.delivered)} / {formatNumber(metrics.sent)}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-700"
                    style={{
                      width: `${clampPercent(metrics.deliveryRate)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-5">
                <HeroMetric
                  label="Attempts"
                  value={metrics.total}
                />
                <HeroMetric
                  label="Sent"
                  value={metrics.sent}
                />
                <HeroMetric
                  label="Delivered"
                  value={metrics.delivered}
                />
                <HeroMetric
                  label="Read"
                  value={metrics.read}
                />
                <HeroMetric
                  label="Failed"
                  value={metrics.failed}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Engagement quality
                </p>
                <h2 className="mt-2 text-xl font-bold text-[#07152f]">
                  Conversion signals
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  What happens after a message leaves the system.
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Target size={18} />
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <MetricCardCompact
                label="Delivery rate"
                value={metrics.deliveryRate}
                icon={CheckCircle2}
                tone="emerald"
              />
              <MetricCardCompact
                label="Read rate"
                value={metrics.readRate}
                icon={Eye}
                tone="blue"
              />
              <MetricCardCompact
                label="Click rate"
                value={metrics.clickRate}
                icon={MousePointerClick}
                tone="violet"
              />
              <MetricCardCompact
                label="Failure rate"
                value={metrics.failureRate}
                icon={AlertCircle}
                tone="rose"
              />
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Engagement depth
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#07152f]">
                    {formatPercent(
                      metrics.engagementRate
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">
                    Total clicks
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#07152f]">
                    {formatNumber(metrics.totalClicks)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            ENGAGEMENT FUNNEL
        ================================================== */}
        <section className="mb-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <SectionHeader
            icon={TrendingUp}
            title="Engagement funnel"
            description="Follow the communication journey from accepted message to measurable engagement."
            badge="Live aggregate"
          />

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              [
                "Sent",
                metrics.sent,
                "bg-blue-500",
                "bg-blue-50",
                "text-blue-700",
              ],
              [
                "Delivered",
                metrics.delivered,
                "bg-emerald-500",
                "bg-emerald-50",
                "text-emerald-700",
              ],
              [
                "Read",
                metrics.read,
                "bg-cyan-500",
                "bg-cyan-50",
                "text-cyan-700",
              ],
              [
                "Clicked",
                metrics.clicked,
                "bg-violet-500",
                "bg-violet-50",
                "text-violet-700",
              ],
            ].map(
              ([
                label,
                value,
                dot,
                bg,
                text,
              ]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      {label}
                    </span>
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${dot}`}
                    />
                  </div>
                  <p className="mt-3 text-2xl font-bold text-[#07152f]">
                    {formatNumber(value)}
                  </p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${bg} ${text}`}
                  >
                    {metrics.total > 0
                      ? `${((value / metrics.total) * 100).toFixed(1)}% of attempts`
                      : "No activity yet"}
                  </span>
                </div>
              )
            )}
          </div>

          <div className="mt-6 h-[290px] rounded-2xl bg-slate-50/70 p-3 ring-1 ring-slate-200 md:p-4">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={engagementData}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 25,
                  left: 10,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#64748b",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  type="category"
                  dataKey="stage"
                  width={75}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#334155",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{
                    fill: "#ffffff",
                  }}
                />
                <Bar
                  dataKey="value"
                  name="Messages"
                  fill="#2563eb"
                  radius={[0, 8, 8, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ==================================================
            DELIVERY STATUS + PERFORMANCE
        ================================================== */}
        <section className="mb-7 grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.35fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
            <SectionHeader
              icon={Activity}
              title="Message status"
              description="Current distribution of delivery states."
            />

            <div className="mt-5 h-[280px]">
              {deliveryChartData.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={deliveryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={98}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {deliveryChartData.map(
                        (entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={
                              CHART_COLORS[
                                index %
                                  CHART_COLORS.length
                              ]
                            }
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip
                      content={
                        <ChartTooltip />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="No delivery data"
                  description="Send a campaign to start generating delivery analytics."
                  icon={Send}
                />
              )}
            </div>

            {deliveryChartData.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {deliveryChartData.map(
                  (item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              CHART_COLORS[
                                index %
                                  CHART_COLORS.length
                              ],
                          }}
                        />
                        <span className="text-xs text-slate-500">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {formatNumber(item.value)}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
            <SectionHeader
              icon={Zap}
              title="Performance scorecard"
              description="Operational indicators calculated from your live delivery records."
              badge={
                metrics.failureRate <= 5
                  ? "Healthy"
                  : "Needs attention"
              }
            />

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <MetricCard
                label="Delivery rate"
                value={metrics.deliveryRate}
                description="Successfully delivered messages compared with sent messages."
                icon={CheckCircle2}
                tone="emerald"
              />
              <MetricCard
                label="Sent rate"
                value={
                  metrics.total > 0
                    ? (metrics.sent /
                        metrics.total) *
                      100
                    : 0
                }
                description="Share of recorded attempts that reached a sent state."
                icon={Send}
                tone="blue"
              />
              <MetricCard
                label="Read rate"
                value={metrics.readRate}
                description="Share of sent messages with a recorded open or read event."
                icon={Eye}
                tone="violet"
              />
              <MetricCard
                label="Failure rate"
                value={metrics.failureRate}
                description="Share of sent attempts currently recorded as failed."
                icon={AlertCircle}
                tone="rose"
              />
            </div>
          </div>
        </section>

        {/* ==================================================
            CHANNEL EFFECTIVENESS
        ================================================== */}
        <section className="mb-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <SectionHeader
            icon={BarChart3}
            title="Channel effectiveness"
            description="Compare delivery, engagement and failure performance across communication channels."
            badge={
              channels.length > 0
                ? `${channels.length} channels`
                : "Aggregate view"
            }
          />

          {channels.length > 0 ? (
            <>
              <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="h-full min-h-[350px] rounded-2xl bg-slate-50/70 p-4 ring-1 ring-slate-200">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={channelVolumeData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -12,
                        bottom: 5,
                      }}
                      barGap={8}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        dataKey="channel"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#64748b",
                          fontSize: 11,
                        }}
                      />
                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#64748b",
                          fontSize: 11,
                        }}
                      />
                      <Tooltip
                        content={
                          <ChartTooltip />
                        }
                        cursor={{
                          fill: "#ffffff",
                        }}
                      />
                      <Bar
                        dataKey="Sent"
                        fill="#2563eb"
                        radius={[5, 5, 0, 0]}
                      />
                      <Bar
                        dataKey="Delivered"
                        fill="#10b981"
                        radius={[5, 5, 0, 0]}
                      />
                      <Bar
                        dataKey="Failed"
                        fill="#ef4444"
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {channelRanking.map(
                    (channel, index) => (
                      <div
                        key={channel.channel}
                        className="rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-bold capitalize text-[#07152f]">
                                {channel.channel}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {formatNumber(
                                  channel.messages
                                )} messages · {formatNumber(channel.clicks)} clicks
                              </p>
                            </div>
                          </div>

                          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                            {formatPercent(
                              channel.readRate
                            )} read
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <SmallStat
                            label="Delivery"
                            value={formatPercent(channel.deliveryRate)}
                          />
                          <SmallStat
                            label="Click"
                            value={formatPercent(channel.clickRate)}
                          />
                          <SmallStat
                            label="Failure"
                            value={formatPercent(channel.failureRate)}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                {channelRanking.slice(0, 3).map(
                  (channel) => (
                    <ChannelPerformanceCard
                      key={channel.channel}
                      channel={channel}
                    />
                  )
                )}
              </div>
            </>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Aggregate communication snapshot
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  The backend currently provides aggregate delivery analytics. Channel-level records will automatically populate this area when available.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <SmallStat
                    label="Attempts"
                    value={formatNumber(metrics.total)}
                  />
                  <SmallStat
                    label="Sent"
                    value={formatNumber(metrics.sent)}
                  />
                  <SmallStat
                    label="Delivered"
                    value={formatNumber(metrics.delivered)}
                  />
                  <SmallStat
                    label="Failed"
                    value={formatNumber(metrics.failed)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-6">
                <EmptyState
                  title="Channel breakdown pending"
                  description="Your aggregate analytics are available now. Channel comparison will appear when channel-level analytics are returned by the API."
                  icon={MessageSquare}
                />
              </div>
            </div>
          )}
        </section>

        {/* ==================================================
            CAMPAIGN WORKFLOW + CAMPAIGN PERFORMANCE
        ================================================== */}
        <section className="mb-7 grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
            <SectionHeader
              icon={Megaphone}
              title="Campaign workflow"
              description="Live count of campaigns in each workflow stage."
            />

            <div className="mt-5 space-y-2.5">
              {campaignWorkflow.map(
                (item) => (
                  <WorkflowCard
                    key={item.key}
                    name={item.label}
                    value={item.value}
                    tone={item.tone}
                  />
                )
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
            <SectionHeader
              icon={Target}
              title="Campaign delivery performance"
              description="Compare the delivery and engagement quality of campaigns represented in the delivery analytics response."
              badge={
                campaignRows.length > 0
                  ? `${campaignRows.length} tracked`
                  : "No campaign breakdown"
              }
            />

            {campaignRows.length > 0 ? (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Campaign
                      </th>
                      <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Attempts
                      </th>
                      <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Delivered
                      </th>
                      <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Read
                      </th>
                      <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Delivery
                      </th>
                      <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Failure
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {campaignRows
                      .sort(
                        (a, b) =>
                          b.messages -
                          a.messages
                      )
                      .slice(0, 8)
                      .map((campaign) => (
                        <tr
                          key={campaign.campaignId}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                        >
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <Megaphone size={14} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-[#07152f]">
                                  Campaign #{campaign.campaignId}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {formatNumber(campaign.clicked)} clicks
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-sm font-semibold text-slate-700">
                            {formatNumber(campaign.messages)}
                          </td>
                          <td className="px-3 py-3 text-sm font-semibold text-slate-700">
                            {formatNumber(campaign.delivered)}
                          </td>
                          <td className="px-3 py-3 text-sm font-semibold text-slate-700">
                            {formatNumber(campaign.opened)}
                          </td>
                          <td className="px-3 py-3">
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                              {formatPercent(campaign.deliveryRate)}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">
                              {formatPercent(
                                campaign.messages > 0
                                  ? (campaign.failed /
                                      campaign.messages) *
                                      100
                                  : 0
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState
                  title="Campaign-level analytics unavailable"
                  description="The API did not return campaign delivery records. Aggregate analytics above are still calculated from the live response."
                  icon={Megaphone}
                />
              </div>
            )}
          </div>
        </section>

        {/* ==================================================
            DELIVERY PIPELINE
        ================================================== */}
        <section className="mb-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <SectionHeader
            icon={Send}
            title="Delivery pipeline"
            description="A compact operational snapshot of the current communication state."
            badge="Operational"
          />

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <PipelineCard
              label="Queued"
              value={metrics.queued}
              icon={Clock3}
              tone="slate"
            />
            <PipelineCard
              label="Sending"
              value={metrics.sending}
              icon={Send}
              tone="blue"
            />
            <PipelineCard
              label="Sent"
              value={metrics.sent}
              icon={Send}
              tone="cyan"
            />
            <PipelineCard
              label="Delivered"
              value={metrics.delivered}
              icon={CheckCircle2}
              tone="emerald"
            />
            <PipelineCard
              label="Read"
              value={metrics.read}
              icon={Eye}
              tone="violet"
            />
            <PipelineCard
              label="Failed"
              value={metrics.failed}
              icon={CircleX}
              tone="rose"
            />
            <PipelineCard
              label="Retrying"
              value={metrics.retrying}
              icon={RefreshCw}
              tone="amber"
            />
          </div>
        </section>

        {/* ==================================================
            FOOTER INSIGHT
        ================================================== */}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-blue-100 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-100">
                <Zap size={16} />
                <span className="text-xs font-bold uppercase tracking-[0.14em]">
                  SmartNotify insight
                </span>
              </div>
              <h2 className="mt-2 text-xl font-bold">
                {metrics.failureRate > 10
                  ? "Delivery reliability needs attention."
                  : metrics.readRate > 30
                    ? "Engagement is showing strong momentum."
                    : metrics.sent > 0
                      ? "Your communication pipeline is active."
                      : "Start a campaign to generate performance insights."}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-blue-100">
                {metrics.failureRate > 10
                  ? "Review failed deliveries and retry patterns in Delivery Tracking to identify operational issues."
                  : metrics.readRate > 30
                    ? "Use channel-level performance and campaign comparisons to understand which communication strategies are working best."
                    : metrics.sent > 0
                      ? "Use the delivery and engagement sections above to monitor communication quality as campaigns progress."
                      : "Once messages are sent, this page will automatically turn delivery and engagement events into actionable analytics."}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
              <span className="text-xs font-semibold text-blue-100">
                Analytics status
              </span>
              <ChevronRight size={16} />
              <span className="text-sm font-bold">
                Live
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


// ============================================================
// SECTION HEADER
// ============================================================

function SectionHeader({
  icon: Icon,
  title,
  description,
  badge,
}) {
  return (
    <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Icon size={18} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#07152f]">
            {title}
          </h2>
        </div>
        <p className="mt-1 pl-11 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      {badge && (
        <span className="w-fit rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
          {badge}
        </span>
      )}
    </div>
  );
}


// ============================================================
// HERO METRIC
// ============================================================

function HeroMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-white">
        {formatNumber(value)}
      </p>
    </div>
  );
}


// ============================================================
// COMPACT METRIC
// ============================================================

function MetricCardCompact({
  label,
  value,
  icon: Icon,
  tone,
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    rose: "bg-rose-50 text-rose-600",
  };

  const bar = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    violet: "bg-violet-500",
    rose: "bg-rose-500",
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${tones[tone] || tones.blue}`}
          >
            <Icon size={14} />
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {label}
          </span>
        </div>
        <span className="text-xs font-bold text-slate-700">
          {formatPercent(value)}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${bar[tone] || bar.blue}`}
          style={{
            width: `${clampPercent(value)}%`,
          }}
        />
      </div>
    </div>
  );
}


// ============================================================
// SMALL STAT
// ============================================================

function SmallStat({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-[#07152f]">
        {value}
      </p>
    </div>
  );
}
