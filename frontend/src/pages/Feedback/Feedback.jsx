import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  MessageSquareText,
  Star,
  ThumbsUp,
  Minus,
  ThumbsDown,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";

import feedbackService from "../../services/feedbackService";


// ============================================================
// STAT CARD
// IMPORTANT: Keep this OUTSIDE the Feedback component.
// ============================================================

const StatCard = ({
  label,
  value,
  icon,
  description,
}) => {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "18px",
        minHeight: "120px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 650,
              color: "#64748b",
              marginBottom: "8px",
            }}
          >
            {label}
          </div>

          <div
            style={{
              fontSize: "27px",
              lineHeight: 1.1,
              fontWeight: 750,
              color: "#0f172a",
            }}
          >
            {value}
          </div>
        </div>

        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "11px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#eff6ff",
            color: "#2563eb",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>

      <div
        style={{
          marginTop: "14px",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        {description}
      </div>
    </div>
  );
};


// ============================================================
// FEEDBACK PAGE
// ============================================================

const Feedback = () => {

  const [feedback, setFeedback] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [sentimentFilter, setSentimentFilter] =
    useState("all");


  // ============================================================
  // LOAD FEEDBACK
  // ============================================================

  const loadFeedback = useCallback(
    async (showRefresh = false) => {

      try {

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const [
          feedbackData,
          analyticsData,
        ] = await Promise.all([
          feedbackService.getAll(),
          feedbackService.getAnalytics(),
        ]);

        setFeedback(
          Array.isArray(feedbackData)
            ? feedbackData
            : []
        );

        setAnalytics(
          analyticsData || null
        );

      } catch (error) {

        console.error(
          "Failed to load feedback:",
          error.response?.data ||
            error.message
        );

      } finally {

        setLoading(false);
        setRefreshing(false);

      }

    },
    []
  );


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    const timer = setTimeout(() => {
      loadFeedback();
    }, 0);

    return () => clearTimeout(timer);

  }, [loadFeedback]);


  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (value) => {

    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString(
      "en-IN",
      {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );

  };


  // ============================================================
  // SENTIMENT
  // ============================================================

  const getSentiment = (value) => {

    return String(
      value || "Pending"
    ).toLowerCase();

  };


  const sentimentIcon = (value) => {

    const sentiment =
      getSentiment(value);

    if (sentiment === "positive") {
      return <ThumbsUp size={15} />;
    }

    if (sentiment === "negative") {
      return <ThumbsDown size={15} />;
    }

    if (sentiment === "neutral") {
      return <Minus size={15} />;
    }

    return <MessageSquareText size={15} />;

  };


  // ============================================================
  // FILTER
  // ============================================================

  const filteredFeedback =
    feedback.filter((item) => {

      const sentiment =
        getSentiment(
          item.sentiment
        );

      const matchesSentiment =
        sentimentFilter === "all" ||
        sentiment === sentimentFilter;

      const query =
        search.trim().toLowerCase();

      if (!query) {
        return matchesSentiment;
      }

      const searchable = [
        item.message,
        item.recipient,
        item.channel,
        item.language,
        item.sentiment,
        item.campaign_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesSentiment &&
        searchable.includes(query)
      );

    });


  // ============================================================
  // STAR RATING
  // ============================================================

  const renderRating = (rating) => {

    const value =
      Number(rating) || 0;

    return (
      <div
        style={{
          display: "flex",
          gap: "2px",
          alignItems: "center",
        }}
      >

        {[1, 2, 3, 4, 5].map(
          (star) => (

            <Star
              key={star}
              size={15}
              fill={
                star <= value
                  ? "currentColor"
                  : "none"
              }
              style={{
                opacity:
                  star <= value
                    ? 1
                    : 0.25,
              }}
            />

          )
        )}

      </div>
    );

  };


  // ============================================================
  // PAGE
  // ============================================================

  return (

    <div
      style={{
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "flex-start",
          gap: "20px",
          marginBottom: "24px",
        }}
      >

        <div>

          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 750,
              color: "#0f172a",
            }}
          >
            Engagement Feedback
          </h1>

          <p
            style={{
              margin:
                "7px 0 0",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Understand how people respond
            to your communications.
          </p>

        </div>

        <button
          type="button"
          onClick={() =>
            loadFeedback(true)
          }
          disabled={refreshing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border:
              "1px solid #dbe2ea",
            background: "#ffffff",
            color: "#334155",
            borderRadius: "10px",
            padding:
              "10px 14px",
            fontWeight: 600,
            cursor:
              refreshing
                ? "not-allowed"
                : "pointer",
          }}
        >

          <RefreshCw
            size={16}
            style={{
              animation:
                refreshing
                  ? "spin 1s linear infinite"
                  : "none",
            }}
          />

          Refresh

        </button>

      </div>


      {/* ======================================================
          ANALYTICS
      ======================================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >

        <StatCard
          label="Total Feedback"
          value={
            analytics?.total_feedback ??
            feedback.length
          }
          icon={
            <MessageSquareText
              size={20}
            />
          }
          description="Responses received"
        />

        <StatCard
          label="Average Rating"
          value={
            analytics?.average_rating != null
              ? `${analytics.average_rating}/5`
              : "—"
          }
          icon={<Star size={20} />}
          description="Across all responses"
        />

        <StatCard
          label="Positive"
          value={
            analytics?.positive_rate != null
              ? `${analytics.positive_rate}%`
              : "0%"
          }
          icon={
            <ThumbsUp size={20} />
          }
          description="Positive sentiment"
        />

        <StatCard
          label="Negative"
          value={
            analytics?.negative_rate != null
              ? `${analytics.negative_rate}%`
              : "0%"
          }
          icon={
            <ThumbsDown size={20} />
          }
          description="Negative sentiment"
        />

      </div>


      {/* ======================================================
          FEEDBACK LIST
      ======================================================= */}

      <div
        style={{
          background: "#ffffff",
          border:
            "1px solid #e5e7eb",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >

        {/* TOOLBAR */}

        <div
          style={{
            padding: "16px",
            borderBottom:
              "1px solid #e5e7eb",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >

          <div
            style={{
              flex: "1 1 260px",
              position: "relative",
            }}
          >

            <Search
              size={17}
              style={{
                position:
                  "absolute",
                left: "12px",
                top: "50%",
                transform:
                  "translateY(-50%)",
                color: "#94a3b8",
              }}
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search feedback..."
              style={{
                width: "100%",
                height: "40px",
                border:
                  "1px solid #dbe2ea",
                borderRadius: "9px",
                padding:
                  "0 12px 0 38px",
                outline: "none",
                color: "#0f172a",
                boxSizing: "border-box",
              }}
            />

          </div>


          <select
            value={sentimentFilter}
            onChange={(event) =>
              setSentimentFilter(
                event.target.value
              )
            }
            style={{
              height: "40px",
              border:
                "1px solid #dbe2ea",
              borderRadius: "9px",
              padding:
                "0 34px 0 12px",
              background:
                "#ffffff",
              color: "#334155",
              fontWeight: 600,
              outline: "none",
            }}
          >

            <option value="all">
              All sentiment
            </option>

            <option value="positive">
              Positive
            </option>

            <option value="neutral">
              Neutral
            </option>

            <option value="negative">
              Negative
            </option>

            <option value="pending">
              Pending
            </option>

          </select>

        </div>


        {/* CONTENT */}

        {loading ? (

          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#64748b",
            }}
          >
            Loading feedback...
          </div>

        ) : filteredFeedback.length === 0 ? (

          <div
            style={{
              padding: "70px 20px",
              textAlign: "center",
              color: "#64748b",
            }}
          >

            <MessageSquareText
              size={42}
              style={{
                opacity: 0.35,
                marginBottom: "12px",
              }}
            />

            <h3
              style={{
                margin:
                  "0 0 6px",
                color: "#334155",
              }}
            >
              No feedback yet
            </h3>

            <p
              style={{
                margin: 0,
                fontSize: "14px",
              }}
            >
              Feedback submitted by
              recipients will appear here.
            </p>

          </div>

        ) : (

          <div
            style={{
              overflowX: "auto",
            }}
          >

            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
                minWidth: "900px",
              }}
            >

              <thead>

                <tr
                  style={{
                    background:
                      "#f8fafc",
                    textAlign: "left",
                  }}
                >

                  <th style={thStyle}>
                    Feedback
                  </th>

                  <th style={thStyle}>
                    Rating
                  </th>

                  <th style={thStyle}>
                    Sentiment
                  </th>

                  <th style={thStyle}>
                    Channel
                  </th>

                  <th style={thStyle}>
                    Language
                  </th>

                  <th style={thStyle}>
                    Recipient
                  </th>

                  <th style={thStyle}>
                    Date
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredFeedback.map(
                  (item) => {

                    const sentiment =
                      getSentiment(
                        item.sentiment
                      );

                    return (

                      <tr
                        key={item.id}
                        style={{
                          borderTop:
                            "1px solid #eef2f7",
                        }}
                      >

                        <td
                          style={{
                            ...tdStyle,
                            maxWidth:
                              "420px",
                          }}
                        >

                          <div
                            style={{
                              color:
                                "#334155",
                              lineHeight:
                                "1.5",
                            }}
                          >
                            {item.message}
                          </div>

                          <div
                            style={{
                              marginTop:
                                "5px",
                              fontSize:
                                "11px",
                              color:
                                "#94a3b8",
                            }}
                          >
                            Campaign #
                            {item.campaign_id}
                          </div>

                        </td>

                        <td style={tdStyle}>
                          {renderRating(
                            item.rating
                          )}
                        </td>

                        <td style={tdStyle}>

                          <span
                            style={{
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              gap: "6px",
                              padding:
                                "5px 9px",
                              borderRadius:
                                "999px",
                              fontSize:
                                "12px",
                              fontWeight: 650,
                              background:
                                sentiment ===
                                "positive"
                                  ? "#ecfdf5"
                                  : sentiment ===
                                    "negative"
                                    ? "#fef2f2"
                                    : "#f1f5f9",
                              color:
                                sentiment ===
                                "positive"
                                  ? "#047857"
                                  : sentiment ===
                                    "negative"
                                    ? "#b91c1c"
                                    : "#475569",
                            }}
                          >

                            {sentimentIcon(
                              sentiment
                            )}

                            {sentiment
                              .charAt(0)
                              .toUpperCase() +
                              sentiment.slice(
                                1
                              )}

                          </span>

                        </td>

                        <td style={tdStyle}>
                          {item.channel ||
                            "—"}
                        </td>

                        <td style={tdStyle}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "5px 9px",
                              borderRadius: "999px",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              fontSize: "12px",
                              fontWeight: 650,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.language || "English"}
                          </span>
                        </td>

                        <td style={tdStyle}>
                          {item.recipient ||
                            "Anonymous"}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {formatDate(
                            item.created_at
                          )}
                        </td>

                      </tr>

                    );

                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ======================================================
          LANGUAGE BREAKDOWN
      ======================================================= */}

      {analytics?.language_breakdown?.length > 0 && (
        <div
          style={{
            marginTop: "18px",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "20px",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: "16px" }}>
              Feedback by Language
            </h3>
            <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "13px" }}>
              Understand which languages your audience uses when responding.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            {analytics.language_breakdown.map((item) => (
              <div key={item.language} style={{ padding: "14px", border: "1px solid #eef2f7", borderRadius: "12px", background: "#f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "8px" }}>
                  <strong style={{ color: "#334155", fontSize: "13px" }}>{item.language}</strong>
                  <span style={{ color: "#2563eb", fontSize: "12px", fontWeight: 700 }}>{item.percentage}%</span>
                </div>
                <div style={{ height: "7px", borderRadius: "999px", background: "#e2e8f0", overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(Number(item.percentage) || 0, 100)}%`, height: "100%", borderRadius: "999px", background: "#2563eb" }} />
                </div>
                <div style={{ marginTop: "7px", color: "#94a3b8", fontSize: "11px" }}>{item.count} response{item.count === 1 ? "" : "s"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================
          INSIGHT
      ======================================================= */}

      {analytics && (
        <div
          style={{
            marginTop: "18px",
            padding: "16px 18px",
            borderRadius: "13px",
            background: "#f8fafc",
            border:
              "1px solid #e5e7eb",
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
          }}
        >

          <TrendingUp
            size={19}
            style={{
              color: "#2563eb",
              marginTop: "2px",
            }}
          />

          <div>

            <strong
              style={{
                color: "#334155",
                fontSize: "13px",
              }}
            >
              Engagement insight
            </strong>

            <p
              style={{
                margin:
                  "4px 0 0",
                color: "#64748b",
                fontSize: "13px",
                lineHeight: 1.5,
              }}
            >
              Feedback sentiment and ratings
              are analyzed automatically to
              help you understand audience
              response.
            </p>

          </div>

        </div>
      )}

    </div>
  );
};


// ============================================================
// TABLE STYLES
// ============================================================

const thStyle = {
  padding: "13px 16px",
  fontSize: "11px",
  fontWeight: 750,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const tdStyle = {
  padding: "15px 16px",
  fontSize: "13px",
  color: "#475569",
  verticalAlign: "top",
};


export default Feedback;