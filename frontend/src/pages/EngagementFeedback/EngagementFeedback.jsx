import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Check,
  CircleAlert,
  MessageSquareText,
  RefreshCw,
  Smile,
  ThumbsDown,
  ThumbsUp,
  Users,
  Languages,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import feedbackService from "../../services/feedbackService";
import campaignService from "../../services/campaignService";

const number = (value) => Number(value ?? 0) || 0;

const firstNumber = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return number(value);
    }
  }
  return 0;
};

const arrayFrom = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.feedback)) return value.feedback;
  if (Array.isArray(value?.responses)) return value.responses;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function chartLabel(value) {
  return String(value || "Unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortDayLabel(date) {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function ChartBar({ label, value, max, tone = "blue" }) {
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 6 : 0) : 0;
  const tones = {
    blue: "bg-blue-500",
    purple: "bg-violet-500",
    green: "bg-emerald-500",
    orange: "bg-amber-500",
    red: "bg-red-500",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="truncate font-semibold text-slate-600">{label}</span>
        <span className="font-bold text-[#07152f]">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${tones[tone]}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function MiniTrendChart({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="flex h-48 items-end gap-2 rounded-xl bg-slate-50/70 px-3 pb-3 pt-5">
      {data.map((item) => {
        const height = item.value > 0 ? Math.max((item.value / max) * 100, 8) : 3;
        return (
          <div key={item.key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <span className="text-[10px] font-bold text-slate-500">{item.value}</span>
            <div className="flex h-28 w-full items-end justify-center">
              <div
                className="w-full max-w-8 rounded-t-lg bg-violet-500 transition-all duration-500"
                style={{ height: `${height}%` }}
                title={`${item.label}: ${item.value}`}
              />
            </div>
            <span className="text-[10px] font-semibold text-slate-400">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function Metric({ icon: Icon, title, value, caption, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-amber-50 text-amber-600",
    purple: "bg-violet-50 text-violet-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#07152f]">{value}</p>
          {caption && <p className="mt-1 text-xs text-slate-400">{caption}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function EngagementFeedback() {
  const [analytics, setAnalytics] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Translation state: translations are kept in the page state so the
  // original feedback in the database is never replaced.
  const [translations, setTranslations] = useState({});
  const [translationLanguage, setTranslationLanguage] = useState({});
  const [translatingId, setTranslatingId] = useState(null);

  const loadCampaigns = useCallback(async () => {
    try {
      const data = await campaignService.getAll();
      setCampaigns(Array.isArray(data) ? data : data?.campaigns || []);
    } catch (error) {
      console.error("Feedback campaign load failed:", error);
    }
  }, []);

  const loadFeedback = useCallback(async () => {
    try {
      const data = selectedCampaign
        ? await feedbackService.getCampaignFeedback(selectedCampaign)
        : await feedbackService.getAll();
      setFeedback(arrayFrom(data));
    } catch (error) {
      console.error("Feedback load failed:", error);
      setFeedback([]);
    }
  }, [selectedCampaign]);

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await feedbackService.getAnalytics();
      setAnalytics(data || {});
    } catch (error) {
      console.error("Feedback analytics load failed:", error);
      setAnalytics({});
    }
  }, []);

  const loadPage = useCallback(
    async (initial = false) => {
      try {
        if (initial) setLoading(true);
        else setRefreshing(true);

        await Promise.all([loadAnalytics(), loadFeedback()]);
      } catch (error) {
        console.error("Engagement feedback error:", error);
        toast.error(
          error?.response?.data?.detail ||
            "Unable to load engagement and feedback data"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadAnalytics, loadFeedback]
  );

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadCampaigns();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadCampaigns]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadPage();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadPage]);

  // Translate one stored feedback response into the language selected by
  // the reviewer. English is the default target language.
  const handleTranslate = async (item) => {
    const feedbackId = item.id;
    const sourceLanguage = String(item.language || "English").trim();
    const targetLanguage =
      translationLanguage[feedbackId] || "English";
    const message =
      item.response || item.message || item.comment || "";

    if (!feedbackId || !message.trim()) {
      toast.error("This feedback has no translatable message.");
      return;
    }

    if (
      sourceLanguage.toLowerCase() ===
      targetLanguage.toLowerCase()
    ) {
      setTranslations((previous) => ({
        ...previous,
        [feedbackId]: {
          content: message,
          sourceLanguage,
          targetLanguage,
        },
      }));
      return;
    }

    try {
      setTranslatingId(feedbackId);

      const result = await feedbackService.translateFeedback({
  content: message.trim(),
  source_language: sourceLanguage,
  target_language: targetLanguage,
});

      const translatedText =
        result?.content ||
        result?.translated_text ||
        result?.translation ||
        result?.message;

      if (!translatedText) {
        throw new Error("Translation service returned no translated text.");
      }

      setTranslations((previous) => ({
        ...previous,
        [feedbackId]: {
          content: translatedText,
          sourceLanguage,
          targetLanguage,
        },
      }));

      toast.success(`Translated to ${targetLanguage}`);
    } catch (error) {
      console.error(
        "Feedback translation failed:",
        error?.response?.data || error?.message
      );

      const detail = error?.response?.data?.detail;
      const readableDetail = Array.isArray(detail)
        ? detail
            .map((item) =>
              typeof item === "string"
                ? item
                : item?.msg || "Invalid translation request"
            )
            .join("; ")
        : typeof detail === "string"
          ? detail
          : "Unable to translate this feedback.";

      toast.error(readableDetail);
    } finally {
      setTranslatingId(null);
    }
  };

  const clearTranslation = (feedbackId) => {
    setTranslations((previous) => {
      const next = { ...previous };
      delete next[feedbackId];
      return next;
    });
  };

    const stats = useMemo(() => {
    const data = analytics || {};
    const sentiment = data.sentiment || data.sentiments || {};

    const positive = firstNumber(
      data.positive,
      data.positive_count,
      sentiment.positive
    );

    const neutral = firstNumber(
      data.neutral,
      data.neutral_count,
      sentiment.neutral
    );

    const negative = firstNumber(
      data.negative,
      data.negative_count,
      sentiment.negative
    );

    const responseCount = firstNumber(
      data.response_count,
      data.total_responses,
      data.responses,
      data.total,
      feedback.length
    );

    const reachedDeliveries = firstNumber(
      data.reached_deliveries,
      data.reached,
      data.delivered,
      data.sent,
      data.total_deliveries
    );

    const calculatedResponseRate =
      reachedDeliveries > 0
        ? (responseCount / reachedDeliveries) * 100
        : 0;

    const participation = firstNumber(
      data.participation_rate,
      data.participation,
      calculatedResponseRate
    );

    const responseRate =
      data.response_rate !== undefined &&
      data.response_rate !== null &&
      data.response_rate !== ""
        ? number(data.response_rate)
        : data.responseRate !== undefined &&
            data.responseRate !== null &&
            data.responseRate !== ""
          ? number(data.responseRate)
          : calculatedResponseRate;

    const averageRating = firstNumber(
      data.average_rating,
      data.avg_rating,
      data.rating
    );

    return {
      totalResponses: responseCount,
      responseCount,
      reachedDeliveries,
      positive,
      neutral,
      negative,
      participation,
      responseRate,
      averageRating,
    };
  }, [analytics, feedback.length]);

  const sentimentTotal =
    stats.positive + stats.neutral + stats.negative;

  const chartData = useMemo(() => {
    const channelMap = new Map();
    const sentimentMap = new Map();
    const dayMap = new Map();

    feedback.forEach((item) => {
      const channel = chartLabel(item.channel || "Unknown");
      channelMap.set(channel, (channelMap.get(channel) || 0) + 1);

      const sentiment = chartLabel(item.sentiment || "Pending");
      sentimentMap.set(sentiment, (sentimentMap.get(sentiment) || 0) + 1);

      const rawDate = item.created_at || item.submitted_at || item.timestamp;
      const date = rawDate ? new Date(rawDate) : null;
      if (date && !Number.isNaN(date.getTime())) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        dayMap.set(key, (dayMap.get(key) || 0) + 1);
      }
    });

    const channelData = [...channelMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));

    const sentimentData = ["Positive", "Neutral", "Negative", "Pending"]
      .map((label) => ({ label, value: sentimentMap.get(label) || 0 }))
      .filter((item) => item.value > 0);

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      days.push({ key, label: shortDayLabel(date), value: dayMap.get(key) || 0 });
    }

    return {
      channelData,
      sentimentData,
      trendData: days,
      channelMax: Math.max(...channelData.map((item) => item.value), 1),
      sentimentMax: Math.max(...sentimentData.map((item) => item.value), 1),
    };
  }, [feedback]);

  if (loading) {
    return (
      <div className="min-h-full bg-[#f5f8fc] px-5 py-8 md:px-8">
        <div className="mx-auto flex min-h-[560px] max-w-[1400px] items-center justify-center">
          <div className="text-center">
            <RefreshCw className="mx-auto animate-spin text-blue-600" size={34} />
            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading engagement and feedback...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f5f8fc] px-5 py-7 md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-100">
              <MessageSquareText size={23} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#07152f]">
                Engagement & Feedback
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Measure audience responses, participation and sentiment.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedCampaign}
              onChange={(event) => setSelectedCampaign(event.target.value)}
              className="min-w-[230px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
            >
              <option value="">All campaigns</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.campaign_name || campaign.name || `Campaign #${campaign.id}`}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => loadPage(false)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60"
            >
              <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon={MessageSquareText}
            title="Total Responses"
            value={stats.totalResponses}
            caption="Recorded audience feedback"
          />
          <Metric
            icon={Users}
            title="Participation Rate"
            value={`${stats.participation.toFixed(2)}%`}
            caption={
              stats.totalDeliveries > 0
                ? `${stats.responseCount} responses / ${stats.totalDeliveries} targeted`
                : "Audience participation"
            }
            tone="purple"
          />
          <Metric
            icon={Activity}
            title="Response Rate"
            value={`${stats.responseRate.toFixed(2)}%`}
            caption={
              stats.reachedDeliveries > 0
                ? `${stats.responseCount} responses / ${stats.reachedDeliveries} reached`
                : "Responses from reached audience"
            }
            tone="green"
          />
          <Metric
            icon={BarChart3}
            title="Average Rating"
            value={stats.averageRating ? stats.averageRating.toFixed(1) : "—"}
            caption="Where rating data is available"
            tone="orange"
          />
        </div>

        <div className="mb-7 grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#07152f]">Sentiment distribution</h2>
                <p className="mt-1 text-sm text-slate-500">Current feedback sentiment mix.</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Smile size={19} /></div>
            </div>
            <div className="space-y-5">
              {chartData.sentimentData.length > 0 ? (
                chartData.sentimentData.map((item) => (
                  <ChartBar key={item.label} label={item.label} value={item.value} max={chartData.sentimentMax}
                    tone={item.label === "Positive" ? "green" : item.label === "Negative" ? "red" : item.label === "Neutral" ? "orange" : "blue"} />
                ))
              ) : (
                <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-400">No sentiment data available.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#07152f]">Feedback by channel</h2>
                <p className="mt-1 text-sm text-slate-500">Where audience responses are coming from.</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><BarChart3 size={19} /></div>
            </div>
            <div className="space-y-5">
              {chartData.channelData.length > 0 ? (
                chartData.channelData.slice(0, 6).map((item) => (
                  <ChartBar key={item.label} label={item.label} value={item.value} max={chartData.channelMax} tone="blue" />
                ))
              ) : (
                <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-400">No channel data available.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#07152f]">7-day response trend</h2>
                <p className="mt-1 text-sm text-slate-500">Feedback records received each day.</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Activity size={19} /></div>
            </div>
            <MiniTrendChart data={chartData.trendData} />
          </div>
        </div>

        <div className="mb-7 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#07152f]">Sentiment overview</h2>
                <p className="mt-1 text-sm text-slate-500">Positive, neutral and negative audience reactions.</p>
              </div>
              <Smile size={21} className="text-violet-600" />
            </div>
            <SentimentRow icon={ThumbsUp} label="Positive" value={stats.positive} total={sentimentTotal} tone="green" />
            <SentimentRow icon={CircleAlert} label="Neutral" value={stats.neutral} total={sentimentTotal} tone="orange" />
            <SentimentRow icon={ThumbsDown} label="Negative" value={stats.negative} total={sentimentTotal} tone="red" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#07152f]">Quick response model</h2>
              <p className="mt-1 text-sm text-slate-500">Use simple recipient actions for campaigns where a full form is unnecessary.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ResponseChoice icon={Check} title="Agree / Helpful" description="One-click positive response" tone="green" />
              <ResponseChoice icon={CircleAlert} title="Disagree / Not helpful" description="One-click negative response" tone="orange" />
              <ResponseChoice icon={ThumbsUp} title="Yes / No" description="Simple participation signal" tone="blue" />
              <ResponseChoice icon={MessageSquareText} title="Comment" description="Optional detailed feedback" tone="purple" />
            </div>
            <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm text-violet-800">
              These actions are the recipient-facing feedback pattern. The dashboard aggregates the responses returned by the existing Feedback APIs.
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-6">
            <div>
              <h2 className="text-lg font-bold text-[#07152f]">Recent feedback</h2>
              <p className="mt-1 text-sm text-slate-500">Responses returned by the SmartNotify feedback service.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {feedback.length} response{feedback.length === 1 ? "" : "s"}
            </span>
          </div>

          {feedback.length === 0 ? (
            <div className="p-10 text-center">
              <MessageSquareText className="mx-auto text-slate-300" size={40} />
              <p className="mt-3 font-semibold text-slate-700">No feedback records yet</p>
              <p className="mt-1 text-sm text-slate-500">Once campaign recipients submit responses, they will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Campaign</th>
                    <th className="px-6 py-4">Channel</th>
                    <th className="px-6 py-4">Response</th>
                    <th className="px-6 py-4">Language</th>
                    <th className="px-6 py-4">Rating</th>
                    <th className="px-6 py-4">Sentiment</th>
                    <th className="px-6 py-4">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feedback.map((item, index) => {
                    const feedbackId = item.id || `${item.campaign_id}-${index}`;
                    const sourceLanguage = String(item.language || "English");
                    const originalText = item.response || item.message || item.comment || "—";
                    const translation = translations[item.id];
                    const targetLanguage = translationLanguage[item.id] || "English";

                    return (
                      <tr key={feedbackId} className="hover:bg-slate-50/70 align-top">
                        <td className="px-6 py-4 text-sm font-semibold text-[#07152f]">
                          {item.campaign_name || item.campaign_id || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm capitalize text-slate-600">
                          {String(item.channel || "—").replaceAll("_", " ")}
                        </td>
                        <td className="max-w-[420px] px-6 py-4 text-sm text-slate-600">
                          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                                <Languages size={13} />
                                Original: {sourceLanguage}
                              </span>
                            </div>

                            <p className="whitespace-pre-wrap leading-6 text-slate-700">
                              {originalText}
                            </p>

                            {(
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <select
                                  value={targetLanguage}
                                  onChange={(event) =>
                                    setTranslationLanguage((previous) => ({
                                      ...previous,
                                      [item.id]: event.target.value,
                                    }))
                                  }
                                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-violet-400"
                                  disabled={translatingId === item.id}
                                  aria-label={`Translation language for feedback ${item.id}`}
                                >
                                  <option value="English">English</option>
                                  <option value="Telugu">Telugu</option>
                                  <option value="Hindi">Hindi</option>
                                  <option value="Tamil">Tamil</option>
                                  <option value="Kannada">Kannada</option>
                                  <option value="Malayalam">Malayalam</option>
                                  <option value="Bengali">Bengali</option>
                                  <option value="Marathi">Marathi</option>
                                  <option value="Gujarati">Gujarati</option>
                                  <option value="Punjabi">Punjabi</option>
<option value="Odia">Odia</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() => handleTranslate(item)}
                                  disabled={translatingId === item.id}
                                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {translatingId === item.id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Languages size={14} />
                                  )}
                                  {translatingId === item.id
                                    ? "Translating..."
                                    : `Translate to ${targetLanguage}`}
                                </button>
                              </div>
                            )}

                            {translation && (
                              <div className="mt-3 rounded-lg border border-violet-100 bg-violet-50 p-3">
                                <div className="mb-1 flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-bold uppercase tracking-wide text-violet-700">
                                    {translation.targetLanguage} Translation
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => clearTranslation(item.id)}
                                    className="text-[11px] font-semibold text-violet-600 hover:text-violet-800"
                                  >
                                    Show Original Only
                                  </button>
                                </div>
                                <p className="whitespace-pre-wrap leading-6 text-violet-950">
                                  {translation.content}
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                            {sourceLanguage}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">{item.rating ?? "—"}</td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize text-slate-600">
                            {item.sentiment || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {formatDate(item.created_at || item.submitted_at || item.timestamp)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SentimentRow({ icon: Icon, label, value, total, tone }) {
  const colors = {
    green: { icon: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
    orange: { icon: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
    red: { icon: "bg-red-50 text-red-600", bar: "bg-red-500" },
  };

  const percent = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="mb-5 last:mb-0">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors[tone].icon}`}>
            <Icon size={17} />
          </div>
          <span className="text-sm font-semibold text-slate-700">{label}</span>
        </div>
        <span className="text-sm font-bold text-[#07152f]">
          {value} <span className="font-normal text-slate-400">({percent.toFixed(1)}%)</span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${colors[tone].bar}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ResponseChoice({ icon: Icon, title, description, tone }) {
  const colors = {
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-violet-50 text-violet-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${colors[tone]}`}>
        <Icon size={19} />
      </div>
      <p className="font-bold text-[#07152f]">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}
