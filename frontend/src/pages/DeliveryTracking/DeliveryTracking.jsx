import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  MousePointerClick,
  RefreshCw,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";

import deliveryService from "../../services/deliveryService";


// ============================================================
// HELPERS
// ============================================================

const formatDate = (value) => {

  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
};


// ============================================================
// STATUS NORMALIZATION
// ============================================================

const normalizeStatus = (status) => {

  if (!status) {
    return "Unknown";
  }

  return String(status)
    .trim()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
};


// ============================================================
// STATUS CLASS
// ============================================================

const getStatusClass = (status) => {

  const normalized =
    String(status || "")
      .toLowerCase();

  if (normalized === "delivered") {

    return "status delivered";
  }

  if (normalized === "read") {

    return "status read";
  }

  if (normalized === "sent") {

    return "status sent";
  }

  if (normalized === "failed") {

    return "status failed";
  }

  if (normalized === "retrying") {

    return "status retrying";
  }

  if (normalized === "queued") {

    return "status queued";
  }

  return "status";
};


// ============================================================
// NORMALIZE CAMPAIGNS
// ============================================================

const normalizeCampaigns = (data) => {

  if (Array.isArray(data)) {

    return data;
  }

  if (Array.isArray(data?.campaigns)) {

    return data.campaigns;
  }

  if (Array.isArray(data?.items)) {

    return data.items;
  }

  if (Array.isArray(data?.results)) {

    return data.results;
  }

  return [];
};


// ============================================================
// NORMALIZE DELIVERIES
// ============================================================

const normalizeDeliveries = (data) => {

  if (Array.isArray(data)) {

    return data;
  }

  if (Array.isArray(data?.deliveries)) {

    return data.deliveries;
  }

  if (Array.isArray(data?.items)) {

    return data.items;
  }

  if (Array.isArray(data?.results)) {

    return data.results;
  }

  return [];
};
// ============================================================
// CHANNEL HEALTH
// ============================================================

const buildChannelHealth = (deliveries = []) => {

  const channels = {};

  deliveries.forEach((delivery) => {

    const channel =
      String(
        delivery.channel || "unknown"
      )
        .trim()
        .toLowerCase();

    if (!channels[channel]) {

      channels[channel] = {
        channel,
        total: 0,
        delivered: 0,
        failed: 0,
      };

    }

    channels[channel].total += 1;

    const status =
      String(
        delivery.status || ""
      )
        .trim()
        .toLowerCase();

    if (status === "delivered") {

      channels[channel].delivered += 1;

    }

    if (status === "failed") {

      channels[channel].failed += 1;

    }

  });

  return Object.values(channels);

};


// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon: Icon,
  label,
  value,
  helper,
}) {

  return (

    <div className="delivery-stat-card">

      <div className="delivery-stat-icon">

        <Icon size={20} />

      </div>


      <div>

        <div className="delivery-stat-label">

          {label}

        </div>


        <div className="delivery-stat-value">

          {value ?? 0}

        </div>


        {helper && (

          <div className="delivery-stat-helper">

            {helper}

          </div>

        )}

      </div>

    </div>
  );
}


// ============================================================
// DELIVERY TABLE
// ============================================================

function DeliveryTable({
  deliveries,
  onRetry,
  onMarkRead,
  onRecordClick,
  retryingId,
  readingId,
  clickingId,
}) {

  if (!deliveries?.length) {

    return (

      <div className="delivery-empty">

        <Send size={32} />

        <h3>
          No delivery records
        </h3>

        <p>
          No deliveries were found
          for this campaign.
        </p>

      </div>
    );
  }


  return (

    <div className="delivery-table-wrapper">

      <table className="delivery-table">

        <thead>

          <tr>

            <th>
              Recipient
            </th>

            <th>
              Channel
            </th>

            <th>
              Status
            </th>

            <th>
              Sent
            </th>

            <th>
              Delivered
            </th>

            <th>
              Opened
            </th>

            <th>
              Clicked
            </th>

            <th>
              Retries
            </th>

            <th>
              Action
            </th>

          </tr>

        </thead>


        <tbody>

          {deliveries.map(
            (delivery) => {

              const isFailed =
                String(
                  delivery.status || ""
                ).toLowerCase() ===
                "failed";


              const canRead =
                !delivery.opened_at &&
                [
                  "sent",
                  "delivered",
                ].includes(
                  String(
                    delivery.status || ""
                  ).toLowerCase()
                );


              const canClick =
                String(
                  delivery.channel || ""
                ).toLowerCase() ===
                  "email" &&
                !delivery.clicked_at &&
                [
                  "sent",
                  "delivered",
                  "read",
                ].includes(
                  String(
                    delivery.status || ""
                  ).toLowerCase()
                );


              return (

                <tr
                  key={delivery.id}
                >

                  <td>

                    <div
                      className="recipient-cell"
                    >

                      <strong>
                        {delivery.recipient ||
                          "Unknown"}
                      </strong>


                      {delivery.error_message && (

                        <small>

                          {
                            delivery.error_message
                          }

                        </small>

                      )}

                    </div>

                  </td>


                  <td>

                    <span
                      className="channel-badge"
                    >

                      {delivery.channel ||
                        "—"}

                    </span>

                  </td>


                  <td>

                    <span
                      className={getStatusClass(
                        delivery.status
                      )}
                    >

                      {normalizeStatus(
                        delivery.status
                      )}

                    </span>

                  </td>


                  <td>

                    {formatDate(
                      delivery.sent_at ||
                      delivery.created_at
                    )}

                  </td>


                  <td>

                    {formatDate(
                      delivery.delivered_at
                    )}

                  </td>


                  <td>

                    <div
                      className="event-cell"
                    >

                      {delivery.opened_at ? (

                        <>

                          <Eye size={15} />

                          <span>

                            {formatDate(
                              delivery.opened_at
                            )}

                          </span>

                        </>

                      ) : (

                        "—"

                      )}

                    </div>

                  </td>


                  <td>

                    <div
                      className="event-cell"
                    >

                      {delivery.clicked_at ? (

                        <>

                          <MousePointerClick
                            size={15}
                          />

                          <span>

                            {delivery.click_count ||
                              1}

                          </span>

                        </>

                      ) : (

                        "—"

                      )}

                    </div>

                  </td>


                  <td>

                    {delivery.retry_count ||
                      0}

                  </td>


                  <td>

                    <div
                      className="delivery-actions"
                    >

                      {isFailed && (

                        <button
                          type="button"
                          className="action-button retry"
                          disabled={
                            retryingId ===
                            delivery.id
                          }
                          onClick={() =>
                            onRetry(
                              delivery.id
                            )
                          }
                        >

                          <RotateCcw
                            size={15}
                          />

                          {retryingId ===
                          delivery.id
                            ? "Retrying..."
                            : "Retry"}

                        </button>

                      )}


                      {canRead && (

                        <button
                          type="button"
                          className="action-button read"
                          disabled={
                            readingId ===
                            delivery.id
                          }
                          onClick={() =>
                            onMarkRead(
                              delivery.id
                            )
                          }
                        >

                          <Eye size={15} />

                          {readingId ===
                          delivery.id
                            ? "Updating..."
                            : "Mark Read"}

                        </button>

                      )}


                      {canClick && (

                        <button
                          type="button"
                          className="action-button click"
                          disabled={
                            clickingId ===
                            delivery.id
                          }
                          onClick={() =>
                            onRecordClick(
                              delivery.id
                            )
                          }
                        >

                          <MousePointerClick
                            size={15}
                          />

                          {clickingId ===
                          delivery.id
                            ? "Updating..."
                            : "Record Click"}

                        </button>

                      )}

                    </div>

                  </td>

                </tr>

              );
            }
          )}

        </tbody>

      </table>

    </div>
  );
}


// ============================================================
// MAIN PAGE
// ============================================================

function DeliveryTracking() {

  const [
    campaigns,
    setCampaigns,
  ] = useState([]);


  const [
    selectedCampaign,
    setSelectedCampaign,
  ] = useState("");


  const [
    deliveries,
    setDeliveries,
  ] = useState([]);


  const [
    analytics,
    setAnalytics,
  ] = useState(null);


  const [
    failedDeliveries,
    setFailedDeliveries,
  ] = useState([]);
  const [
  channelHealth,
  setChannelHealth,
] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    loadingDeliveries,
    setLoadingDeliveries,
  ] = useState(false);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [
    retryingId,
    setRetryingId,
  ] = useState(null);


  const [
    readingId,
    setReadingId,
  ] = useState(null);


  const [
    clickingId,
    setClickingId,
  ] = useState(null);


  const [
    error,
    setError,
  ] = useState("");



  // ==========================================================
  // LOAD CAMPAIGN LIST
  // ==========================================================

  const loadCampaigns =
    useCallback(
      async () => {

        try {

          const data =
            await deliveryService.getCampaigns();


          const campaignList =
            normalizeCampaigns(
              data
            );


          setCampaigns(
            campaignList
          );


          console.log(
            "DELIVERY CAMPAIGNS RESPONSE:",
            campaignList
          );


          return campaignList;


        } catch (requestError) {

          console.error(
            "Failed to load campaigns:",
            requestError
          );


          setCampaigns([]);


          setError(
            requestError?.response
              ?.data
              ?.detail ||
            "Unable to load campaigns."
          );


          return [];

        }

      },
      []
    );



  // ==========================================================
  // LOAD DELIVERY ANALYTICS
  //
  // IMPORTANT:
  // selectedCampaign is now passed to the backend.
  //
  // /delivery/analytics
  //       = all campaigns
  //
  // /delivery/analytics?campaign_id=87
  //       = campaign 87 only
  // ==========================================================

  const loadAnalytics =
    useCallback(
      async (
        campaignId = ""
      ) => {

        try {

          let query = "";


          if (
            campaignId !== null &&
            campaignId !== undefined &&
            String(campaignId).trim() !== ""
          ) {

            const params =
              new URLSearchParams();

            params.set(
              "campaign_id",
              String(campaignId)
            );

            query =
              `?${params.toString()}`;
          }


          console.log(
            "LOADING DELIVERY ANALYTICS:",
            query || "ALL CAMPAIGNS"
          );


          const data =
            await deliveryService.getAnalytics(
              query
            );


          console.log(
            "DELIVERY ANALYTICS RESPONSE:",
            data
          );


          setAnalytics(
            data
          );


          return data;


        } catch (requestError) {

          console.error(
            "Failed to load delivery analytics:",
            requestError
          );


          setAnalytics(null);


          setError(
            requestError?.response
              ?.data
              ?.detail ||
            "Unable to load delivery analytics."
          );


          return null;
        }

      },
      []
    );



  // ==========================================================
  // LOAD FAILED DELIVERIES
  // ==========================================================

  const loadFailed =
    useCallback(
      async () => {

        try {

          const data =
            await deliveryService
              .getFailedDeliveries();


          const rows =
            normalizeDeliveries(
              data
            );


          setFailedDeliveries(
            rows
          );


          return rows;


        } catch (requestError) {

          console.error(
            "Failed to load failed deliveries:",
            requestError
          );


          setFailedDeliveries(
            []
          );


          return [];

        }

      },
      []
    );



  // ==========================================================
  // LOAD CAMPAIGN DELIVERIES
  // ==========================================================

  const loadDeliveries =
    useCallback(
      async (
        campaignId = selectedCampaign
      ) => {

        if (
          campaignId === null ||
          campaignId === undefined ||
          String(campaignId).trim() === ""
        ) {

          setDeliveries([]);

          return [];

        }


        setLoadingDeliveries(
          true
        );

        setError("");


        try {

          console.log(
            "LOADING CAMPAIGN DELIVERIES:",
            campaignId
          );


          const data =
            await deliveryService
              .getCampaignDeliveries(
                campaignId
              );


          const rows =
            normalizeDeliveries(
              data
            );


          console.log(
            "CAMPAIGN DELIVERY RESPONSE:",
            rows
          );


          setDeliveries(
            rows
          );

          setChannelHealth(
            buildChannelHealth(rows)
          );


          return rows;


        } catch (requestError) {

          console.error(
            "Failed to load campaign deliveries:",
            requestError
          );


          setDeliveries(
            []
          );


          setError(
            requestError?.response
              ?.data
              ?.detail ||
            "Unable to load campaign delivery records."
          );


          return [];


        } finally {

          setLoadingDeliveries(
            false
          );

        }

      },
      [selectedCampaign]
    );



  // ==========================================================
  // INITIAL CAMPAIGN LOAD
  // ==========================================================

  useEffect(() => {

    let cancelled = false;


    const loadInitialData =
      async () => {

        setLoading(true);

        setError("");


        try {

          
            await loadCampaigns();


          if (cancelled) {
            return;
          }


          /*
           * Do not automatically select a campaign.
           *
           * "All campaigns" remains the default.
           *
           * This is important because the user should
           * explicitly choose the campaign they want
           * to inspect.
           */


          await Promise.all([
  loadAnalytics(""),
  loadFailed(),
]);

        } catch (requestError) {

          if (cancelled) {
            return;
          }


          console.error(
            "Initial delivery tracking load failed:",
            requestError
          );


          setError(
            requestError?.response
              ?.data
              ?.detail ||
            "Unable to load delivery tracking data."
          );


        } finally {

          if (!cancelled) {

            setLoading(
              false
            );

          }

        }

      };


    const timer =
      setTimeout(
        loadInitialData,
        0
      );


    return () => {

      cancelled = true;

      clearTimeout(timer);

    };

  }, [
    loadCampaigns,
    loadAnalytics,
    loadFailed,
  ]);


  // ==========================================================
  // CAMPAIGN CHANGE
  //
  // IMPORTANT:
  // When the user selects campaign 87:
  //
  // 1. /delivery/campaign/87
  // 2. /delivery/analytics?campaign_id=87
  //
  // are both requested.
  // ==========================================================

  useEffect(() => {

    let cancelled = false;


    const fetchCampaignData =
      async () => {

        if (
          !selectedCampaign
        ) {

          /*
           * All campaigns selected.
           *
           * No individual campaign delivery
           * table should be displayed.
           */

          setDeliveries([]);

          setChannelHealth([]);

          return;

        }


        setLoadingDeliveries(
          true
        );

        setError("");


        try {

          const [
            deliveryData,
            analyticsData,
          ] = await Promise.all([

            deliveryService
              .getCampaignDeliveries(
                selectedCampaign
              ),

            deliveryService.getAnalytics(
              `?campaign_id=${encodeURIComponent(
                selectedCampaign
              )}`
            ),

          ]);


          if (cancelled) {
            return;
          }


          const rows =
            normalizeDeliveries(
              deliveryData
            );


          console.log(
            "CAMPAIGN DELIVERY RESPONSE:",
            rows
          );


          console.log(
            "CAMPAIGN ANALYTICS RESPONSE:",
            analyticsData
          );


          setDeliveries(
            rows
          );
          setChannelHealth(
  buildChannelHealth(rows)
);


          setAnalytics(
            analyticsData
          );


        } catch (requestError) {

          if (cancelled) {
            return;
          }


          console.error(
            "Failed to load selected campaign:",
            requestError
          );


          setDeliveries(
            []
          );


          setAnalytics(
            null
          );


          setError(
            requestError?.response
              ?.data
              ?.detail ||
            "Unable to load selected campaign data."
          );


        } finally {

          if (!cancelled) {

            setLoadingDeliveries(
              false
            );

          }

        }

      };


    const timer =
      setTimeout(
        fetchCampaignData,
        0
      );


    return () => {

      cancelled = true;

      clearTimeout(timer);

    };

  }, [
    selectedCampaign,
  ]);



  // ==========================================================
  // REFRESH
  //
  // IMPORTANT:
  // Refresh respects the currently selected campaign.
  // ==========================================================

  const handleRefresh =
    async () => {

      if (refreshing) {
        return;
      }


      setRefreshing(
        true
      );

      setError("");


      try {

        /*
         * Always reload the campaign list.
         */

        await loadCampaigns();


        /*
         * Reload failed deliveries.
         */

        await loadFailed();


        /*
         * Reload analytics for the
         * currently selected campaign.
         */

        await loadAnalytics(
          selectedCampaign
        );


        /*
         * If a campaign is selected,
         * reload its individual records.
         */

        if (
          selectedCampaign
        ) {

          await loadDeliveries(
            selectedCampaign
          );

        } else {

          setDeliveries([]);

        }


      } catch (requestError) {

        console.error(
          "Delivery tracking refresh failed:",
          requestError
        );


        setError(
          requestError?.response
            ?.data
            ?.detail ||
          "Unable to refresh delivery tracking."
        );


      } finally {

        setRefreshing(
          false
        );

      }

    };



  // ==========================================================
  // RETRY
  // ==========================================================

  const handleRetry =
    async (
      deliveryId
    ) => {

      setRetryingId(
        deliveryId
      );

      setError("");


      try {

        await deliveryService
          .retryDelivery(
            deliveryId
          );


        await Promise.all([

          loadFailed(),

          loadAnalytics(
            selectedCampaign
          ),

        ]);


        if (
          selectedCampaign
        ) {

          await loadDeliveries(
            selectedCampaign
          );

        }


      } catch (requestError) {

  console.error(
    "Retry failed:",
    requestError
  );

  const responseData =
    requestError?.response?.data;

  const detail =
    responseData?.detail;

  let message =
    "Unable to retry delivery.";

  if (typeof detail === "string") {

    message = detail;

  } else if (
    detail &&
    typeof detail === "object"
  ) {

    message =
      detail.error ||
      detail.message ||
      "Delivery retry failed.";

  } else if (
    typeof responseData?.error === "string"
  ) {

    message =
      responseData.error;

  } else if (
    typeof responseData?.message === "string"
  ) {

    message =
      responseData.message;

  } else if (
    typeof requestError?.message === "string"
  ) {

    message =
      requestError.message;

  }

  setError(message);

} finally {

        setRetryingId(
          null
        );

      }

    };



  // ==========================================================
  // MARK READ
  // ==========================================================

  const handleMarkRead =
    async (
      deliveryId
    ) => {

      setReadingId(
        deliveryId
      );

      setError("");


      try {

        await deliveryService
          .markDeliveryRead(
            deliveryId
          );


        await Promise.all([

          loadAnalytics(
            selectedCampaign
          ),

          loadFailed(),

        ]);


        if (
          selectedCampaign
        ) {

          await loadDeliveries(
            selectedCampaign
          );

        }


      } catch (requestError) {

        console.error(
          "Mark read failed:",
          requestError
        );


        setError(
          requestError?.response
            ?.data
            ?.detail ||
          "Unable to mark delivery as read."
        );


      } finally {

        setReadingId(
          null
        );

      }

    };



  // ==========================================================
  // RECORD CLICK
  // ==========================================================

  const handleRecordClick =
    async (
      deliveryId
    ) => {

      setClickingId(
        deliveryId
      );

      setError("");


      try {

        await deliveryService
          .markDeliveryClicked(
            deliveryId
          );


        await Promise.all([

          loadAnalytics(
            selectedCampaign
          ),

          loadFailed(),

        ]);


        if (
          selectedCampaign
        ) {

          await loadDeliveries(
            selectedCampaign
          );

        }


      } catch (requestError) {

        console.error(
          "Record click failed:",
          requestError
        );


        setError(
          requestError?.response
            ?.data
            ?.detail ||
          "Unable to record click."
        );


      } finally {

        setClickingId(
          null
        );

      }

    };



  // ==========================================================
  // DERIVED ANALYTICS
  // ==========================================================

  const stats =
    useMemo(
      () => {

        const source =
          analytics || {};


        return {

          total:
            source.total ??
            source.total_messages ??
            0,


          sent:
            source.sent ??
            0,


          delivered:
            source.delivered ??
            0,


          opened:
            source.opened ??
            source.read ??
            0,


          clicked:
            source.clicked ??
            0,


          failed:
            source.failed ??
            0,


          queued:
            source.queued ??
            0,


          retrying:
            source.retrying ??
            0,


          deliveryRate:
            source.delivery_rate ??
            source.deliveryRate ??
            0,


          openRate:
            source.open_rate ??
            source.read_rate ??
            source.openRate ??
            0,


          clickRate:
            source.click_rate ??
            source.clickRate ??
            0,

        };

      },
      [analytics]
    );



  // ==========================================================
  // RENDER
  // ==========================================================

  if (loading) {

    return (

      <div className="delivery-page">

        <div className="delivery-loading">

          <RefreshCw
            size={28}
            className="spin"
          />

          <p>
            Loading delivery tracking...
          </p>

        </div>

      </div>

    );

  }



  return (

    <div className="delivery-page">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="delivery-header">

        <div>

          <h1>
            Delivery Tracking
          </h1>

          <p>
            Monitor delivery status,
            failures, retries and
            channel health.
          </p>

        </div>


        <button
          type="button"
          className="refresh-button"
          onClick={handleRefresh}
          disabled={refreshing}
        >

          <RefreshCw
            size={17}
            className={
              refreshing
                ? "spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}

        </button>

      </div>



      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (

        <div
          className="delivery-error"
        >

          <AlertCircle
            size={18}
          />

          <span>
            {error}
          </span>

        </div>

      )}



      {/* ====================================================
          CAMPAIGN SELECTOR
      ==================================================== */}

      <div
        className="campaign-selector"
      >

        <label
          htmlFor="campaign-select"
        >
          Campaign
        </label>


        <div
          className="select-wrapper"
        >

          <select
            id="campaign-select"
            value={
              selectedCampaign
            }
            onChange={(event) => {

              const value =
                event.target.value;

              console.log(
                "SELECTED CAMPAIGN:",
                value
              );

              setSelectedCampaign(
                value
              );

            }}
          >

            <option value="">
              All campaigns
            </option>


            {campaigns.map(
              (campaign) => {

                const id =
                  campaign.campaign_id ??
                  campaign.id;


                const name =
                  campaign.campaign_name ??
                  campaign.name ??
                  `Campaign ${id}`;


                return (

                  <option
                    key={id}
                    value={id}
                  >

                    {name}

                  </option>

                );

              }
            )}

          </select>


          <ChevronDown
            size={17}
          />

        </div>

      </div>



      {/* ====================================================
          STATS
      ==================================================== */}

      <div
        className="delivery-stats"
      >

        <StatCard
          icon={Send}
          label="Sent"
          value={stats.sent}
          helper={`${stats.total} total attempts`}
        />


        <StatCard
          icon={CheckCircle2}
          label="Delivered"
          value={stats.delivered}
          helper={`${Number(
            stats.deliveryRate
          ).toFixed(1)}%`}
        />


        <StatCard
          icon={Eye}
          label="Opened"
          value={stats.opened}
          helper={`${Number(
            stats.openRate
          ).toFixed(1)}%`}
        />


        <StatCard
          icon={MousePointerClick}
          label="Clicked"
          value={stats.clicked}
          helper={`${Number(
            stats.clickRate
          ).toFixed(1)}%`}
        />


        <StatCard
          icon={XCircle}
          label="Failed"
          value={stats.failed}
          helper={`${stats.retrying} retrying`}
        />

      </div>



      {/* ====================================================
          ADVANCED DELIVERY COMMAND CENTER
      ==================================================== */}

      <section className="delivery-command-center">

        <div className="delivery-command-main">

          <div className="delivery-command-header">
            <div>
              <div className="delivery-eyebrow">
                <Activity size={14} />
                Live delivery intelligence
              </div>
              <h2>Delivery command center</h2>
              <p>
  A real-time operational view of message flow, delivery quality, failures and retries.
</p>
            </div>

            <div className="delivery-live-pill">
              <span className="delivery-live-dot" />
              Live tracking
            </div>
          </div>

          <div className="delivery-pulse-grid">
            <div className="delivery-pulse-card delivery-pulse-primary">
              <div className="delivery-pulse-top">
                <span>Delivery success</span>
                <CheckCircle2 size={18} />
              </div>
              <strong>
                {Number(stats.deliveryRate || 0).toFixed(1)}%
              </strong>
              <div className="delivery-progress-track">
                <div
                  className="delivery-progress-fill primary"
                  style={{
                    width: `${Math.min(100, Math.max(0, Number(stats.deliveryRate || 0)))}%`,
                  }}
                />
              </div>
              <small>
                {stats.delivered} delivered from {stats.sent} sent attempts
              </small>
            </div>

            <div className="delivery-pulse-card">
  <div className="delivery-pulse-top">
    <span>Delivery volume</span>
    <Send size={18} />
  </div>

  <strong>
    {stats.sent}
  </strong>

  <div className="delivery-progress-track">
    <div
      className="delivery-progress-fill primary"
      style={{
        width: `${Math.min(
          100,
          Math.max(
            0,
            Number(stats.total || 0) > 0
              ? (Number(stats.sent || 0) / Number(stats.total || 0)) * 100
              : 0
          )
        )}%`,
      }}
    />
  </div>

  <small>
    {stats.sent} messages sent from {stats.total} total attempts
  </small>
</div>
            <div className="delivery-pulse-card">
              <div className="delivery-pulse-top">
                <span>Failure exposure</span>
                <AlertCircle size={18} />
              </div>
              <strong>
                {Number(stats.total || 0) > 0
                  ? `${((Number(stats.failed || 0) / Number(stats.total || 0)) * 100).toFixed(1)}%`
                  : "0.0%"}
              </strong>
              <div className="delivery-progress-track">
                <div
                  className="delivery-progress-fill failure"
                  style={{
                    width: `${Math.min(100, Math.max(0, Number(stats.total || 0) > 0 ? (Number(stats.failed || 0) / Number(stats.total || 0)) * 100 : 0))}%`,
                  }}
                />
              </div>
              <small>
                {stats.failed} failed attempts currently recorded
              </small>
            </div>
          </div>

          <div className="delivery-state-rail">
            <div className="delivery-state-item">
              <span className="delivery-state-dot queued" />
              <div>
                <span>Queued</span>
                <strong>{stats.queued}</strong>
              </div>
            </div>

            <div className="delivery-state-line" />

            <div className="delivery-state-item">
              <span className="delivery-state-dot sending" />
              <div>
                <span>Sending</span>
                <strong>{analytics?.sending ?? 0}</strong>
              </div>
            </div>

            <div className="delivery-state-line" />

            <div className="delivery-state-item">
              <span className="delivery-state-dot sent" />
              <div>
                <span>Sent</span>
                <strong>{stats.sent}</strong>
              </div>
            </div>

            <div className="delivery-state-line" />

            <div className="delivery-state-item">
              <span className="delivery-state-dot delivered" />
              <div>
                <span>Delivered</span>
                <strong>{stats.delivered}</strong>
              </div>
            </div>

            <div className="delivery-state-line" />

            <div className="delivery-state-item">
              <span className="delivery-state-dot failed" />
              <div>
                <span>Failed</span>
                <strong>{stats.failed}</strong>
              </div>
            </div>
          </div>

        </div>

        <aside className="delivery-command-side">
          <div className="delivery-side-icon">
            <Activity size={20} />
          </div>
          <p className="delivery-side-label">Delivery health score</p>
          <div className="delivery-score-row">
            <strong>
              {Math.round(
                Math.max(
                  0,
                  Math.min(
                    100,
                    Number(stats.deliveryRate || 0) * 0.75 +
                    Math.max(
                      0,
                      25 -
                        (
                          Number(stats.total || 0) > 0
                            ? (Number(stats.failed || 0) / Number(stats.total || 0)) * 100
                            : 0
                        ) * 0.25
                    )
                  )
                )
              )}
            </strong>
            <span>/ 100</span>
          </div>
          <p className="delivery-score-copy">
  {Number(stats.failed || 0) > 0
    ? "Review failed deliveries and retry eligible messages."
    : Number(stats.retrying || 0) > 0
      ? "Some deliveries are being retried."
      : Number(stats.queued || 0) > 0
        ? "Messages are waiting in the delivery queue."
        : Number(stats.sent || 0) > 0
          ? "Delivery flow is operating normally."
          : "Start a campaign to activate delivery monitoring."}
</p>

          <div className="delivery-side-divider" />

          <div className="delivery-side-metric">
  <span>Queued</span>
  <strong>{stats.queued}</strong>
</div>

<div className="delivery-side-metric">
  <span>Retrying</span>
  <strong>{stats.retrying}</strong>
</div>

<div className="delivery-side-metric">
  <span>Failed</span>
  <strong>{stats.failed}</strong>
</div>
        </aside>

      </section>





      {/* ====================================================
          DELIVERY HEALTH
      ==================================================== */}

      <section
        className="delivery-section"
      >

        <div
          className="section-heading"
        >

          <div>

            <h2>
              Delivery health
            </h2>

            <p>
              Operational status overview.
            </p>

          </div>

        </div>


        <div className="health-grid">

          <div className="health-card">

            <CheckCircle2
              size={20}
            />

            <span>
              Successful
            </span>

            <strong>
              {Math.max(
                stats.sent -
                stats.failed,
                0
              )}
            </strong>

          </div>


          <div className="health-card">

            <Clock3
              size={20}
            />

            <span>
              Queued
            </span>

            <strong>
              {stats.queued}
            </strong>

          </div>


          <div className="health-card">

            <RefreshCw
              size={20}
            />

            <span>
              Retrying
            </span>

            <strong>
              {stats.retrying}
            </strong>

          </div>


          <div className="health-card">

            <XCircle
              size={20}
            />

            <span>
              Failed
            </span>

            <strong>
              {stats.failed}
            </strong>

          </div>

        </div>

      </section>

      {/* ====================================================
    CHANNEL HEALTH
==================================================== */}

<section className="delivery-section">

  <div className="section-heading">

    <div>

      <h2>
        Channel health
      </h2>

      <p>
        Delivery performance across active communication channels.
      </p>

    </div>

  </div>


  {channelHealth.length === 0 ? (

    <div className="delivery-empty">

      <Activity size={32} />

      <h3>
        No channel activity
      </h3>

      <p>
        Channel health will appear when delivery records are available.
      </p>

    </div>

  ) : (

    <div className="channel-health-grid">

      {channelHealth.map((channel) => {

        const deliveryRate =
          channel.total > 0
            ? (channel.delivered / channel.total) * 100
            : 0;

        const channelName =
          channel.channel
            ? channel.channel.charAt(0).toUpperCase() +
              channel.channel.slice(1)
            : "Unknown";

        return (

          <div
            className="channel-health-card"
            key={channel.channel}
          >

            <div className="channel-health-header">

              <div>

                <span className="channel-health-name">
                  {channelName}
                </span>

                <span className="channel-health-total">
                  {channel.total} attempts
                </span>

              </div>

              <strong>
                {deliveryRate.toFixed(1)}%
              </strong>

            </div>


            <div className="delivery-progress-track">

              <div
                className="delivery-progress-fill primary"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      deliveryRate
                    )
                  )}%`,
                }}
              />

            </div>


            <div className="channel-health-stats">

              <span>
                Delivered
                <strong>
                  {channel.delivered}
                </strong>
              </span>

              <span>
                Failed
                <strong>
                  {channel.failed}
                </strong>
              </span>

            </div>

          </div>

        );

      })}

    </div>

  )}

</section>

      {/* ====================================================
          CAMPAIGN DELIVERY DETAILS
      ==================================================== */}

      <section
        className="delivery-section"
      >

        <div
          className="section-heading"
        >

          <div>

            <h2>
              Campaign delivery details
            </h2>

            <p>

              {selectedCampaign
                ? "Individual delivery records for the selected campaign."
                : "Select a campaign above to inspect each delivery record."}

            </p>

          </div>

        </div>


        {!selectedCampaign ? (

          <div
            className="delivery-empty"
          >

            <Send size={32} />

            <h3>
              Choose a campaign
            </h3>

            <p>
              Campaign-level delivery
              records will appear here.
            </p>

          </div>

        ) : loadingDeliveries ? (

          <div
            className="delivery-loading"
          >

            <RefreshCw
              size={25}
              className="spin"
            />

            <p>
              Loading delivery records...
            </p>

          </div>

        ) : (

          <DeliveryTable
            deliveries={
              deliveries
            }
            onRetry={
              handleRetry
            }
            onMarkRead={
              handleMarkRead
            }
            onRecordClick={
              handleRecordClick
            }
            retryingId={
              retryingId
            }
            readingId={
              readingId
            }
            clickingId={
              clickingId
            }
          />

        )}

      </section>



      {/* ====================================================
          FAILED DELIVERIES
      ==================================================== */}

      <section
        className="delivery-section"
      >

        <div
          className="section-heading"
        >

          <div>

            <h2>
              Failed deliveries
            </h2>

            <p>
              Messages that can be retried
              from SmartNotify.
            </p>

          </div>


          <div
            className="failed-count"
          >

            {failedDeliveries.length}

            {" "}

            failed

          </div>

        </div>


        {failedDeliveries.length === 0 ? (

          <div
            className="delivery-empty"
          >

            <CheckCircle2
              size={32}
            />

            <h3>
              No failed deliveries
            </h3>

            <p>
              Everything is currently healthy.
            </p>

          </div>

        ) : (

          <DeliveryTable
            deliveries={
              failedDeliveries
            }
            onRetry={
              handleRetry
            }
            onMarkRead={
              handleMarkRead
            }
            onRecordClick={
              handleRecordClick
            }
            retryingId={
              retryingId
            }
            readingId={
              readingId
            }
            clickingId={
              clickingId
            }
          />

        )}

      </section>



      {/* ====================================================
          PAGE STYLES
      ==================================================== */}

      <style>{`

        .delivery-page {
          padding: 28px;
          max-width: 1500px;
          margin: 0 auto;
        }


        .delivery-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 24px;
        }


        .delivery-header h1 {
          margin: 0 0 6px;
          font-size: 30px;
          font-weight: 700;
        }


        .delivery-header p {
          margin: 0;
          color: #64748b;
        }


        .refresh-button,
        .action-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid #dbe2ea;
          background: white;
          border-radius: 8px;
          padding: 9px 13px;
          cursor: pointer;
          font-weight: 600;
        }


        .refresh-button:disabled,
        .action-button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }


        .delivery-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 15px;
          border-radius: 9px;
          background: #fff1f2;
          border: 1px solid #fecdd3;
          color: #be123c;
          margin-bottom: 20px;
        }


        .campaign-selector {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-bottom: 24px;
          max-width: 460px;
        }


        .campaign-selector label {
          font-size: 13px;
          font-weight: 700;
          color: #334155;
        }


        .select-wrapper {
          position: relative;
        }


        .select-wrapper select {
          width: 100%;
          appearance: none;
          padding: 12px 40px 12px 14px;
          border: 1px solid #dbe2ea;
          border-radius: 9px;
          background: white;
          font-size: 14px;
        }


        .select-wrapper svg {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }


        .delivery-stats {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 24px;
        }


        .delivery-stat-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          padding: 18px;
          display: flex;
          gap: 13px;
        }


        .delivery-stat-icon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #f1f5f9;
        }


        .delivery-stat-label {
          font-size: 13px;
          color: #64748b;
        }


        .delivery-stat-value {
          font-size: 25px;
          font-weight: 750;
          margin-top: 2px;
        }


        .delivery-stat-helper {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }


        .delivery-section {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 22px;
          margin-bottom: 22px;
        }


        .section-heading {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 20px;
        }


        .section-heading h2 {
          margin: 0 0 5px;
          font-size: 19px;
        }


        .section-heading p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
        }


        .funnel {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }


        .funnel-item {
          min-width: 120px;
          padding: 16px;
          border-radius: 11px;
          background: #f8fafc;
          text-align: center;
        }


        .funnel-item span {
          display: block;
          color: #64748b;
          font-size: 13px;
        }


        .funnel-item strong {
          display: block;
          font-size: 24px;
          margin-top: 4px;
        }


        .funnel-arrow {
          color: #94a3b8;
          font-size: 22px;
        }


        .rate-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-top: 18px;
        }


        .rate-grid > div {
          padding: 15px;
          border-radius: 10px;
          background: #f8fafc;
        }


        .rate-grid span {
          display: block;
          font-size: 12px;
          color: #64748b;
        }


        .rate-grid strong {
          font-size: 20px;
          display: block;
          margin-top: 3px;
        }


        .health-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }


        .health-card {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }


        .health-card span {
          color: #64748b;
          font-size: 13px;
        }


        .health-card strong {
          font-size: 20px;
        }


        /* ============================================================
           CHANNEL HEALTH
        ============================================================ */

        .channel-health-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 14px;
        }


        .channel-health-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #ffffff;
          padding: 16px;
        }


        .channel-health-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }


        .channel-health-header > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }


        .channel-health-name {
          color: #0f172a;
          font-size: 14px;
          font-weight: 750;
        }


        .channel-health-total {
          color: #94a3b8;
          font-size: 11px;
        }


        .channel-health-header > strong {
          color: #07152f;
          font-size: 18px;
        }


        .channel-health-stats {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 12px;
        }


        .channel-health-stats span {
          display: flex;
          flex-direction: column;
          gap: 3px;
          color: #64748b;
          font-size: 11px;
        }


        .channel-health-stats strong {
          color: #334155;
          font-size: 13px;
        }


        .delivery-table-wrapper {
          overflow-x: auto;
        }


        .delivery-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
        }


        .delivery-table th {
          text-align: left;
          padding: 12px;
          font-size: 12px;
          color: #64748b;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
        }


        .delivery-table td {
          padding: 13px 12px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
          vertical-align: top;
        }


        .recipient-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: 230px;
        }


        .recipient-cell small {
          color: #ef4444;
          line-height: 1.4;
        }


        .channel-badge {
          display: inline-flex;
          padding: 5px 8px;
          border-radius: 6px;
          background: #f1f5f9;
          font-size: 12px;
        }


        .status {
          display: inline-flex;
          padding: 5px 9px;
          border-radius: 999px;
          background: #f1f5f9;
          font-size: 12px;
          font-weight: 700;
        }


        .status.delivered {
          background: #ecfdf5;
          color: #047857;
        }


        .status.read {
          background: #eff6ff;
          color: #1d4ed8;
        }


        .status.sent {
          background: #f8fafc;
          color: #334155;
        }


        .status.failed {
          background: #fff1f2;
          color: #be123c;
        }


        .status.retrying {
          background: #fff7ed;
          color: #c2410c;
        }


        .status.queued {
          background: #fefce8;
          color: #a16207;
        }


        .event-cell {
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
        }


        .delivery-actions {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          min-width: 160px;
        }


        .action-button {
          font-size: 12px;
          padding: 7px 9px;
        }


        .action-button.retry {
          color: #b45309;
        }


        .action-button.read {
          color: #2563eb;
        }


        .action-button.click {
          color: #7c3aed;
        }


        .delivery-empty,
        .delivery-loading {
          min-height: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #64748b;
        }


        .delivery-empty h3 {
          margin: 12px 0 4px;
          color: #334155;
        }


        .delivery-empty p {
          margin: 0;
        }


        .failed-count {
          padding: 7px 10px;
          border-radius: 8px;
          background: #fff1f2;
          color: #be123c;
          font-size: 13px;
          font-weight: 700;
        }


        .spin {
          animation: delivery-spin 1s linear infinite;
        }


        @keyframes delivery-spin {

          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }

        }


        .delivery-command-center {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 18px;
          margin-bottom: 22px;
        }

        .delivery-command-main {
          overflow: hidden;
          border: 1px solid #dbe4ef;
          border-radius: 18px;
          background: linear-gradient(145deg, #ffffff 0%, #f8fbff 100%);
          box-shadow: 0 14px 34px rgba(15, 23, 42, .06);
          padding: 22px;
        }

        .delivery-command-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .delivery-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 7px;
          color: #2563eb;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .delivery-command-header h2 {
          margin: 0;
          color: #07152f;
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -.02em;
        }

        .delivery-command-header p {
          max-width: 650px;
          margin: 5px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.55;
        }

        .delivery-live-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
          border: 1px solid #bbf7d0;
          border-radius: 999px;
          background: #f0fdf4;
          color: #15803d;
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 800;
        }

        .delivery-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 4px rgba(34, 197, 94, .12);
        }

        .delivery-pulse-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .delivery-pulse-card {
          min-width: 0;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #ffffff;
          padding: 15px;
        }

        .delivery-pulse-primary {
          border-color: #bfdbfe;
          background: linear-gradient(145deg, #eff6ff, #ffffff);
        }

        .delivery-pulse-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
        }

        .delivery-pulse-primary .delivery-pulse-top svg {
          color: #16a34a;
        }

        .delivery-pulse-card > strong {
          display: block;
          margin-top: 8px;
          color: #07152f;
          font-size: 25px;
          line-height: 1;
        }

        .delivery-progress-track {
          height: 6px;
          margin-top: 12px;
          overflow: hidden;
          border-radius: 999px;
          background: #e9eef5;
        }

        .delivery-progress-fill {
          height: 100%;
          min-width: 0;
          border-radius: inherit;
          transition: width .7s ease;
        }

        .delivery-progress-fill.primary { background: #2563eb; }
        .delivery-progress-fill.failure { background: #ef4444; }

        .delivery-pulse-card small {
          display: block;
          margin-top: 9px;
          overflow: hidden;
          color: #94a3b8;
          font-size: 10px;
          line-height: 1.45;
          text-overflow: ellipsis;
        }

        .delivery-state-rail {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 18px;
          border-top: 1px solid #e8eef5;
          padding-top: 17px;
        }

        .delivery-state-item {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;
        }

        .delivery-state-item > div {
          min-width: 0;
        }

        .delivery-state-item span:not(.delivery-state-dot) {
          display: block;
          color: #64748b;
          font-size: 10px;
          font-weight: 600;
        }

        .delivery-state-item strong {
          display: block;
          margin-top: 1px;
          color: #07152f;
          font-size: 15px;
        }

        .delivery-state-dot {
          width: 9px;
          height: 9px;
          flex-shrink: 0;
          border-radius: 50%;
        }

        .delivery-state-dot.queued { background: #eab308; }
        .delivery-state-dot.sending { background: #3b82f6; }
        .delivery-state-dot.sent { background: #6366f1; }
        .delivery-state-dot.delivered { background: #22c55e; }
        .delivery-state-dot.failed { background: #ef4444; }

        .delivery-state-line {
          height: 1px;
          flex: 0 0 22px;
          background: #dbe4ef;
        }

        .delivery-command-side {
          position: relative;
          overflow: hidden;
          border-radius: 18px;
          background: #07152f;
          padding: 22px;
          color: white;
          box-shadow: 0 14px 34px rgba(7, 21, 47, .14);
        }

        .delivery-command-side::after {
          position: absolute;
          right: -45px;
          top: -45px;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: rgba(59, 130, 246, .12);
          content: '';
        }

        .delivery-side-icon {
          position: relative;
          z-index: 1;
          display: grid;
          width: 40px;
          height: 40px;
          place-items: center;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 12px;
          background: rgba(255,255,255,.08);
          color: #93c5fd;
        }

        .delivery-side-label {
          position: relative;
          z-index: 1;
          margin: 18px 0 0;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .12em;
        }

        .delivery-score-row {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: baseline;
          gap: 5px;
          margin-top: 4px;
        }

        .delivery-score-row strong {
          font-size: 42px;
          line-height: 1;
        }

        .delivery-score-row span {
          color: #64748b;
          font-size: 12px;
        }

        .delivery-score-copy {
          position: relative;
          z-index: 1;
          min-height: 48px;
          margin: 10px 0 0;
          color: #cbd5e1;
          font-size: 11px;
          line-height: 1.6;
        }

        .delivery-side-divider {
          height: 1px;
          margin: 18px 0 12px;
          background: rgba(255,255,255,.1);
        }

        .delivery-side-metric {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 7px 0;
        }

        .delivery-side-metric span {
          color: #94a3b8;
          font-size: 11px;
        }

        .delivery-side-metric strong {
          color: white;
          font-size: 13px;
        }

        .delivery-section {
          box-shadow: 0 8px 25px rgba(15, 23, 42, .035);
        }

        .delivery-stat-card {
          position: relative;
          overflow: hidden;
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
        }

        .delivery-stat-card::after {
          position: absolute;
          right: -24px;
          bottom: -30px;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: #f8fafc;
          content: '';
        }

        .delivery-stat-card:hover {
          transform: translateY(-2px);
          border-color: #cbd5e1;
          box-shadow: 0 12px 24px rgba(15, 23, 42, .07);
        }

        .delivery-table tbody tr {
          transition: background .15s ease;
        }

        .delivery-table tbody tr:hover {
          background: #f8fbff;
        }

        @media (max-width: 1100px) {
          .delivery-command-center {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .delivery-command-header {
            flex-direction: column;
          }

          .delivery-pulse-grid {
            grid-template-columns: 1fr;
          }

          .delivery-state-rail {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .delivery-state-line {
            display: none;
          }
        }

        @media (max-width: 1000px) {

          .delivery-stats {
            grid-template-columns:
              repeat(2, 1fr);
          }


          .health-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }


          .channel-health-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

        }


        @media (max-width: 650px) {

          .delivery-page {
            padding: 16px;
          }


          .delivery-header {
            flex-direction: column;
          }


          .delivery-stats,
          .health-grid,
          .rate-grid,
          .channel-health-grid {
            grid-template-columns: 1fr;
          }

        }

      `}</style>

    </div>

  );
}


export default DeliveryTracking;