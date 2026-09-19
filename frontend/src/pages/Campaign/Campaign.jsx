import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import {
  Megaphone,
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  Clock3,
  CheckCircle2,
  FileText,
  X,
  Send,
  Mail,
  Smartphone,
  MessageSquare,
  Bell,
  Globe2,
  CalendarDays,
  Users,
  Radio,
  Clock,
  Hash,
} from "lucide-react";

import api from "../../config/apiConfig";
import CampaignForm from "../../components/Campaign/CampaignForm";
import "./CampaignDelivery.css";

export default function Campaign() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();

  // =====================================================
  // CURRENT USER ROLE
  // =====================================================

  const userRole = String(
    currentUser?.role || ""
  )
    .trim()
    .toLowerCase();

  const isCampaignManager =
    userRole === "campaign manager";

  const isCommunicationTeam =
    userRole === "communication team";

  // Support both role values used by the application/UI.
  // The header may display "Administrator" while the backend/user
  // record can use "Admin".
  const isAdmin =
    userRole === "admin" ||
    userRole === "administrator";

  // =====================================================
  // STATE
  // =====================================================

  const [campaigns, setCampaigns] = useState([]);
  const [audiences, setAudiences] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);

  // =====================================================
  // CAMPAIGN VIEW
  // =====================================================

  const [viewCampaign, setViewCampaign] = useState(null);

  // =====================================================
  // SEARCH / FILTER
  // =====================================================

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");

  // =====================================================
  // CAMPAIGN DELIVERY
  // =====================================================

  const [deliveryCampaign, setDeliveryCampaign] =
    useState(null);

  const [deliveryChannels, setDeliveryChannels] =
    useState(["email"]);

  const [deliveryRecipients, setDeliveryRecipients] =
    useState({});

  const [sendingCampaign, setSendingCampaign] =
    useState(false);

  // =====================================================
  // LOAD CAMPAIGNS
  // =====================================================

  const loadCampaigns = async () => {
    try {
      setLoading(true);

      const response = await api.get("/campaign/");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.items || [];

      console.log(
        "CAMPAIGNS FROM BACKEND:",
        data
      );

      setCampaigns(data);
    } catch (error) {
      console.error(
        "LOAD CAMPAIGNS ERROR:",
        error.response?.data ||
          error.message
      );

      toast.error(
        error.response?.data?.detail ||
          "Unable to load campaigns."
      );

      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD AUDIENCES
  // =====================================================

  const loadAudiences = async () => {
    try {
      const response = await api.get(
        "/audience/"
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.items || [];

      console.log(
        "AUDIENCES FROM BACKEND:",
        data
      );

      setAudiences(data);
    } catch (error) {
      console.error(
        "LOAD AUDIENCES ERROR:",
        error.response?.data ||
          error.message
      );

      toast.error(
        error.response?.data?.detail ||
          "Unable to load audiences."
      );

      setAudiences([]);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const initialLoad = async () => {
      await Promise.all([
        loadCampaigns(),
        loadAudiences(),
      ]);
    };

    initialLoad();
  }, []);

  // =====================================================
  // OPEN CAMPAIGN FROM GLOBAL SEARCH
  // =====================================================

  useEffect(() => {
    const campaignId = searchParams.get("campaignId");

    if (!campaignId || campaigns.length === 0) {
      return;
    }

    const selectedCampaign = campaigns.find(
      (campaign) =>
        String(campaign.id) === String(campaignId)
    );

    if (!selectedCampaign) {
      return;
    }

    // Defer the local state update until the current effect has
    // finished. This preserves the existing view modal while
    // avoiding React's set-state-in-effect lint rule.
    setTimeout(() => {
      setViewCampaign(selectedCampaign);
    }, 0);

    // Remove the search parameter after opening the selected
    // campaign so refreshing the page does not reopen it.
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete("campaignId");
        return next;
      },
      { replace: true }
    );
  }, [
    campaigns,
    searchParams,
    setSearchParams,
  ]);

  // =====================================================
  // OPEN ADD FORM
  // =====================================================

  const openAddForm = () => {
    setEditingCampaign(null);
    setShowForm(false);

    navigate(
      "/ai-studio?mode=create"
    );
  };

  // =====================================================
  // OPEN EDIT FORM
  // =====================================================

  const openEditForm = (campaign) => {
    setEditingCampaign(campaign);
    setShowForm(true);
  };

  // =====================================================
  // OPEN CAMPAIGN VIEW
  // =====================================================

  const openViewCampaign = (campaign) => {
    setViewCampaign(campaign);
  };

  // =====================================================
  // CLOSE CAMPAIGN VIEW
  // =====================================================

  const closeViewCampaign = () => {
    setViewCampaign(null);
  };

  // =====================================================
  // OPEN DELIVERY
  // =====================================================

  const openDelivery = (campaign) => {
    const status = String(
      campaign.status || ""
    ).toLowerCase();

    if (
      ![
        "approved",
        "scheduled",
      ].includes(status)
    ) {
      toast.error(
        "Only approved or scheduled campaigns can be sent."
      );

      return;
    }

    setDeliveryCampaign(campaign);

    setDeliveryChannels(
      Array.isArray(campaign.channels) &&
        campaign.channels.length
        ? campaign.channels
        : ["email"]
    );

    setDeliveryRecipients({});
  };

  // =====================================================
  // CLOSE DELIVERY
  // =====================================================

  const closeDelivery = () => {
    if (sendingCampaign) {
      return;
    }

    setDeliveryCampaign(null);
    setDeliveryChannels(["email"]);
    setDeliveryRecipients({});
  };

  // =====================================================
  // TOGGLE DELIVERY CHANNEL
  // =====================================================

  const toggleDeliveryChannel = (
    channel
  ) => {
    setDeliveryChannels(
      (previous) =>
        previous.includes(channel)
          ? previous.filter(
              (item) =>
                item !== channel
            )
          : [
              ...previous,
              channel,
            ]
    );
  };

  // =====================================================
  // SEND CAMPAIGN
  // =====================================================

  const sendCampaign = async () => {
    if (!deliveryCampaign) {
      return;
    }

    if (
      deliveryChannels.length === 0
    ) {
      toast.error(
        "Select at least one delivery channel."
      );

      return;
    }

    const missing =
      deliveryChannels.filter(
        (channel) =>
          channel !==
            "web_broadcast" &&
          !String(
            deliveryRecipients[
              channel
            ] || ""
          ).trim()
      );

    if (missing.length) {
      toast.error(
        `Enter recipient/token for: ${missing
          .map((item) =>
            item.replace(
              "_",
              " "
            )
          )
          .join(", ")}`
      );

      return;
    }

    try {
      setSendingCampaign(true);

      const response =
        await api.post(
          "/channels/send",
          {
            campaign_id:
              deliveryCampaign.id,

            channels:
              deliveryChannels,

            recipients:
              deliveryRecipients,

            subject:
              deliveryCampaign.subject ||
              "SmartNotify Campaign",

            content:
              deliveryCampaign.content,
          }
        );

      const successCount =
        response.data?.results?.filter(
          (item) =>
            item.status ===
            "Sent"
        ).length || 0;

      if (
        successCount ===
        deliveryChannels.length
      ) {
        toast.success(
          "All selected channels sent successfully."
        );

        closeDelivery();
      } else if (
        successCount > 0
      ) {
        toast.success(
          `${successCount}/${deliveryChannels.length} channels sent successfully.`
        );

        closeDelivery();
      } else {
        toast.error(
          "All selected channels failed. Check delivery logs."
        );
      }

      await loadCampaigns();
    } catch (error) {
      console.error(
        "CAMPAIGN DELIVERY ERROR:",
        error
      );

      toast.error(
        error.response?.data
          ?.detail ||
          "One or more delivery channels failed."
      );

      await loadCampaigns();
    } finally {
      setSendingCampaign(false);
    }
  };

  // =====================================================
  // CAMPAIGN REVIEW / APPROVAL
  // =====================================================

  const submitForReview = async (
    campaign
  ) => {
    try {
      await api.put(
        `/campaign/${campaign.id}`,
        {
          campaign_name:
            campaign.campaign_name,

          campaign_type:
            campaign.campaign_type ||
            "Announcement",

          channels:
            campaign.channels || [],

          subject:
            campaign.subject || "",

          content:
            campaign.content || "",

          audience_id:
            campaign.audience_id ??
            null,

          schedule_time:
            campaign.schedule_time ??
            null,

          schedule_frequency:
            campaign.schedule_frequency ||
            "one_time",

          recipients:
            campaign.recipients || {},

          status:
            "Pending Review",
        }
      );

      toast.success(
        "Campaign submitted for admin review."
      );

      await loadCampaigns();
    } catch (error) {
      console.error(
        "SUBMIT FOR REVIEW ERROR:",
        error.response?.data ||
          error.message
      );

      toast.error(
        error.response?.data?.detail ||
          "Unable to submit campaign for review."
      );
    }
  };

  // =====================================================
  // ADMIN REVIEW
  // =====================================================

  const reviewCampaign = async (
    campaign,
    decision
  ) => {
    const action =
      decision === "approve"
        ? "approve"
        : "reject";

    try {
      await api.post(
        `/campaign/${campaign.id}/${action}`
      );

      toast.success(
        action === "approve"
          ? "Campaign approved successfully."
          : "Campaign rejected. The Campaign Manager can make changes."
      );

      await loadCampaigns();
    } catch (error) {
      console.error(
        `CAMPAIGN ${action.toUpperCase()} ERROR:`,
        error.response?.data ||
          error.message
      );

      toast.error(
        error.response?.data?.detail ||
          `Unable to ${action} campaign.`
      );
    }
  };

  // =====================================================
  // CLOSE FORM
  // =====================================================

  const closeForm = () => {
    setShowForm(false);
    setEditingCampaign(null);
  };

  // =====================================================
  // SAVE CAMPAIGN
  // =====================================================

  const handleSave = async (
    formData
  ) => {
    try {
      console.log(
        "FINAL CAMPAIGN PAYLOAD:",
        formData
      );

      let response;

      if (editingCampaign) {
        response =
          await api.put(
            `/campaign/${editingCampaign.id}`,
            formData
          );

        toast.success(
          "Campaign updated successfully."
        );
      } else {
        response =
          await api.post(
            "/campaign/",
            formData
          );

        toast.success(
          "Campaign created successfully."
        );
      }

      await loadCampaigns();

      return response.data;
    } catch (error) {
      console.error(
        "SAVE CAMPAIGN ERROR:",
        error.response?.data ||
          error.message
      );

      const detail =
        error.response?.data
          ?.detail;

      if (
        Array.isArray(detail)
      ) {
        toast.error(
          detail
            .map(
              (item) =>
                item?.msg ||
                String(item)
            )
            .join(", ")
        );
      } else {
        toast.error(
          detail ||
            "Unable to save campaign."
        );
      }

      throw error;
    }
  };

  // =====================================================
  // DELETE CAMPAIGN
  // =====================================================

  const handleDelete = async (
    id
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this campaign?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/campaign/${id}`
      );

      toast.success(
        "Campaign deleted successfully."
      );

      await loadCampaigns();
    } catch (error) {
      console.error(
        "DELETE CAMPAIGN ERROR:",
        error.response?.data ||
          error.message
      );

      toast.error(
        error.response?.data?.detail ||
          "Unable to delete campaign."
      );
    }
  };

  // =====================================================
  // FILTER CAMPAIGNS
  // =====================================================

  const filteredCampaigns =
    useMemo(() => {
      return campaigns.filter(
        (campaign) => {
          const text =
            `${campaign.campaign_name || ""} ${
              campaign.subject || ""
            }`.toLowerCase();

          const matchesSearch =
            text.includes(
              search.toLowerCase()
            );

          const matchesStatus =
            !statusFilter ||
            String(
              campaign.status || ""
            ).toLowerCase() ===
              statusFilter.toLowerCase();

          const matchesChannel =
            !channelFilter ||
            String(
              campaign.channel || ""
            ).toLowerCase() ===
              channelFilter.toLowerCase();

          return (
            matchesSearch &&
            matchesStatus &&
            matchesChannel
          );
        }
      );
    }, [
      campaigns,
      search,
      statusFilter,
      channelFilter,
    ]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const totalCampaigns =
    campaigns.length;

  const activeCampaigns =
    campaigns.filter(
      (campaign) =>
        [
          "Active",
          "Approved",
          "Scheduled",
        ].includes(
          campaign.status
        )
    ).length;

  const completedCampaigns =
    campaigns.filter(
      (campaign) =>
        campaign.status ===
          "Completed" ||
        campaign.status === "Sent"
    ).length;

  const draftCampaigns =
    campaigns.filter(
      (campaign) =>
        !campaign.status ||
        campaign.status ===
          "Draft"
    ).length;

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (
    value
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "-";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =====================================================
  // FORMAT CHANNEL NAME
  // =====================================================

  const formatChannelName = (
    channel
  ) => {
    const value = String(
      channel || ""
    )
      .trim()
      .toLowerCase();

    const channelNames = {
      email: "Email",
      sms: "SMS",
      whatsapp: "WhatsApp",
      push: "Push Notification",
      web_broadcast:
        "Web Broadcast",
    };

    return (
      channelNames[value] ||
      String(channel || "")
    );
  };

  // =====================================================
  // GET CAMPAIGN CHANNELS
  // =====================================================

  const getCampaignChannels = (
    campaign
  ) => {
    if (
      Array.isArray(
        campaign?.channels
      )
    ) {
      return campaign.channels;
    }

    if (
      campaign?.channel
    ) {
      return [
        campaign.channel,
      ];
    }

    return [];
  };

  // =====================================================
  // FORMAT FREQUENCY
  // =====================================================

  const formatFrequency = (
    value
  ) => {
    if (!value) {
      return "One Time";
    }

    const normalized =
      String(value)
        .trim()
        .toLowerCase();

    const frequencyMap = {
      one_time: "One Time",
      once: "One Time",
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      recurring: "Recurring",
    };

    return (
      frequencyMap[
        normalized
      ] ||
      String(value)
    );
  };

  // =====================================================
  // GET AUDIENCE
  // =====================================================

  const getCampaignAudience = (
    campaign
  ) => {
    if (
      !campaign
    ) {
      return null;
    }

    return audiences.find(
      (item) =>
        Number(item.id) ===
        Number(
          campaign.audience_id
        )
    );
  };

  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (
    status
  ) => {
    const value = String(
      status || "Draft"
    ).toLowerCase();

    if (
      value === "completed" ||
      value === "sent"
    ) {
      return "sn-status sn-status-purple";
    }

    if (
      value === "active" ||
      value === "approved"
    ) {
      return "sn-status sn-status-green";
    }

    if (
      value === "scheduled"
    ) {
      return "sn-status sn-status-blue";
    }

    if (
      value ===
        "pending review" ||
      value === "review"
    ) {
      return "sn-status sn-status-orange";
    }

    if (
      value === "sending"
    ) {
      return "sn-status sn-status-blue";
    }

    if (
      value === "rejected"
    ) {
      return "sn-status sn-status-red";
    }

    return "sn-status sn-status-gray";
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="sn-page">

        <div className="sn-loading">

          <div className="sn-spinner" />

          <p>
            Loading campaigns...
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="sn-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="sn-page-header">

        <div>

          <div className="sn-eyebrow">
            CAMPAIGN MANAGEMENT
          </div>

          <h1 className="sn-page-title">
            Campaign Management
          </h1>

          <p className="sn-page-subtitle">
            Create, manage and monitor
            public awareness campaigns.
          </p>

        </div>

        {isCampaignManager && (
          <button
            type="button"
            className="sn-primary-button"
            onClick={openAddForm}
          >
            <Plus size={20} />

            Add Campaign
          </button>
        )}

      </div>

      {/* =================================================
          KPI CARDS
      ================================================= */}

      <div className="sn-kpi-grid">

        <div className="sn-kpi-card sn-kpi-blue">

          <div className="sn-kpi-label">
            Total Campaigns
          </div>

          <div className="sn-kpi-value">
            {totalCampaigns}
          </div>

          <div className="sn-kpi-icon">
            <Megaphone size={23} />
          </div>

        </div>

        <div className="sn-kpi-card sn-kpi-green">

          <div className="sn-kpi-label">
            Active Campaigns
          </div>

          <div className="sn-kpi-value">
            {activeCampaigns}
          </div>

          <div className="sn-kpi-icon">
            <CheckCircle2 size={23} />
          </div>

        </div>

        <div className="sn-kpi-card sn-kpi-purple">

          <div className="sn-kpi-label">
            Completed Campaigns
          </div>

          <div className="sn-kpi-value">
            {completedCampaigns}
          </div>

          <div className="sn-kpi-icon">
            <FileText size={23} />
          </div>

        </div>

        <div className="sn-kpi-card sn-kpi-orange">

          <div className="sn-kpi-label">
            Draft Campaigns
          </div>

          <div className="sn-kpi-value">
            {draftCampaigns}
          </div>

          <div className="sn-kpi-icon">
            <Clock3 size={23} />
          </div>

        </div>

      </div>

      {/* =================================================
          SEARCH / FILTER
      ================================================= */}

      <div className="sn-filter-card">

        <div className="sn-search-box">

          <Search size={20} />

          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          {search && (
            <button
              type="button"
              className="sn-search-clear"
              onClick={() =>
                setSearch("")
              }
            >
              <X size={16} />
            </button>
          )}

        </div>

        <select
          className="sn-filter-select"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value
            )
          }
        >
          <option value="">
            All Status
          </option>

          <option value="Draft">
            Draft
          </option>

          <option value="Pending Review">
            Pending Review
          </option>

          <option value="Approved">
            Approved
          </option>

          <option value="Scheduled">
            Scheduled
          </option>

          <option value="Sending">
            Sending
          </option>

          <option value="Completed">
            Completed
          </option>

          <option value="Rejected">
            Rejected
          </option>

        </select>

        <select
          className="sn-filter-select"
          value={channelFilter}
          onChange={(e) =>
            setChannelFilter(
              e.target.value
            )
          }
        >
          <option value="">
            All Channels
          </option>

          <option value="WhatsApp">
            WhatsApp
          </option>

          <option value="SMS">
            SMS
          </option>

          <option value="Email">
            Email
          </option>

          <option value="Push">
            Push Notification
          </option>

        </select>

      </div>

      {/* =================================================
          CAMPAIGN TABLE
      ================================================= */}

      <div className="sn-table-card">

        <div className="sn-table-heading">

          <div>

            <h2>
              Campaigns
            </h2>

            <p>
              Manage your public
              awareness campaigns.
            </p>

          </div>

          <span className="sn-record-count">

            {filteredCampaigns.length}{" "}
            campaigns

          </span>

        </div>

        <div className="sn-table-wrapper">

          <table className="sn-table">

            <thead>

              <tr>

                <th>
                  Campaign Name
                </th>

                <th>
                  Subject
                </th>

                <th>
                  Audience
                </th>

                <th>
                  Status
                </th>

                <th>
                  Created At
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredCampaigns.length ===
              0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="sn-empty-cell"
                  >

                    <div className="sn-empty-icon">
                      <Megaphone size={30} />
                    </div>

                    <h3>
                      No campaigns found
                    </h3>

                    <p>
                      {isCampaignManager
                        ? "Create your first campaign to get started."
                        : "Campaigns created by the Campaign Manager will appear here."}
                    </p>

                    {isCampaignManager && (
                      <button
                        type="button"
                        className="sn-primary-button sn-empty-button"
                        onClick={openAddForm}
                      >
                        <Plus size={18} />

                        Add Campaign
                      </button>
                    )}

                  </td>

                </tr>

              ) : (

                filteredCampaigns.map(
                  (campaign) => {

                    const audience =
                      audiences.find(
                        (item) =>
                          Number(
                            item.id
                          ) ===
                          Number(
                            campaign.audience_id
                          )
                      );

                    return (
                      <tr
                        key={
                          campaign.id
                        }
                      >

                        {/* CAMPAIGN NAME */}

                        <td>

                          <div className="sn-campaign-name">

                            {campaign.campaign_name ||
                              "-"}

                          </div>

                        </td>

                        {/* SUBJECT */}

                        <td>

                          {campaign.subject ||
                            "-"}

                        </td>

                        {/* AUDIENCE */}

                        <td>

                          <span className="sn-audience-badge">

                            {audience
                              ? audience.name
                              : campaign.audience_id
                              ? `Audience #${campaign.audience_id}`
                              : "General Public"}

                          </span>

                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={getStatusClass(
                              campaign.status
                            )}
                          >

                            <span className="sn-status-dot" />

                            {campaign.status ||
                              "Draft"}

                          </span>

                        </td>

                        {/* CREATED DATE */}

                        <td>

                          <span className="sn-date">

                            {formatDate(
                              campaign.created_at ||
                                campaign.createdAt
                            )}

                          </span>

                        </td>

                        {/* ACTIONS */}

                        <td>

                          <div className="sn-actions">

                            {/* =================================================
                                VIEW
                            ================================================= */}

                            <button
                              type="button"
                              className="sn-action-view"
                              title="View campaign"
                              aria-label="View campaign"
                              onClick={() =>
                                openViewCampaign(
                                  campaign
                                )
                              }
                            >

                              <Eye
                                size={17}
                              />

                            </button>

                            {/* =================================================
                                EDIT
                            ================================================= */}

                            {isCampaignManager && (
                              <button
                                type="button"
                                className="sn-action-edit"
                                title="Edit"
                                aria-label="Edit campaign"
                                onClick={() =>
                                  openEditForm(
                                    campaign
                                  )
                                }
                              >

                                <Edit3
                                  size={17}
                                />

                              </button>
                            )}

                            {/* =================================================
                                SUBMIT FOR REVIEW
                            ================================================= */}

                            {isCampaignManager &&
                              [
                                "Draft",
                                "Rejected",
                              ].includes(
                                campaign.status ||
                                  "Draft"
                              ) && (
                                <button
                                  type="button"
                                  className="sn-action-send"
                                  title="Submit for review"
                                  aria-label="Submit campaign for review"
                                  onClick={() =>
                                    submitForReview(
                                      campaign
                                    )
                                  }
                                >

                                  <Clock3
                                    size={17}
                                  />

                                </button>
                              )}

                            {/* =================================================
                                ADMIN APPROVAL
                            ================================================= */}

                            {isAdmin &&
                              String(
                                campaign.status ||
                                  ""
                              )
                                .trim()
                                .toLowerCase() ===
                                "pending review" && (
                                <>
                                  <button
                                    type="button"
                                    className="sn-action-send"
                                    title="Approve campaign"
                                    aria-label="Approve campaign"
                                    onClick={() =>
                                      reviewCampaign(
                                        campaign,
                                        "approve"
                                      )
                                    }
                                  >

                                    <CheckCircle2
                                      size={17}
                                    />

                                  </button>

                                  <button
                                    type="button"
                                    className="sn-action-delete"
                                    title="Reject campaign"
                                    aria-label="Reject campaign"
                                    onClick={() =>
                                      reviewCampaign(
                                        campaign,
                                        "reject"
                                      )
                                    }
                                  >

                                    <X
                                      size={17}
                                    />

                                  </button>
                                </>
                              )}

                            {/* =================================================
                                SEND
                            ================================================= */}

                            {isCommunicationTeam &&
                              [
                                "Approved",
                                "Scheduled",
                              ].includes(
                                campaign.status
                              ) && (
                                <button
                                  type="button"
                                  className="sn-action-send"
                                  title="Send campaign"
                                  aria-label="Send campaign"
                                  onClick={() =>
                                    openDelivery(
                                      campaign
                                    )
                                  }
                                >

                                  <Send
                                    size={17}
                                  />

                                </button>
                              )}

                            {/* =================================================
                                DELETE
                            ================================================= */}

                            {isCampaignManager && (
                              <button
                                type="button"
                                className="sn-action-delete"
                                title="Delete"
                                aria-label="Delete campaign"
                                onClick={() =>
                                  handleDelete(
                                    campaign.id
                                  )
                                }
                              >

                                <Trash2
                                  size={17}
                                />

                              </button>
                            )}

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

        {/* =================================================
            TABLE FOOTER
        ================================================= */}

        <div className="sn-table-footer">

          <span>

            Showing{" "}
            {filteredCampaigns.length}{" "}
            of{" "}
            {campaigns.length}{" "}
            campaigns

          </span>

          {isCampaignManager && (
            <button
              type="button"
              onClick={openAddForm}
              className="sn-secondary-add"
            >

              <Plus size={17} />

              Add Campaign

            </button>
          )}

        </div>

      </div>

      {/* =================================================
          ADD / EDIT CAMPAIGN FORM
      ================================================= */}

      {showForm && (
        <CampaignForm
          initialData={
            editingCampaign
          }
          audiences={audiences}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      {/* ============================================================
          CAMPAIGN VIEW MODAL
          READ-ONLY
          
          Available to:
          - Admin
          - Campaign Manager
          - Communication Team
      ============================================================ */}

      {viewCampaign && (
        <div
          className="sn-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="campaign-view-title"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeViewCampaign();
            }
          }}
        >

          <div className="sn-campaign-modal">

            {/* =====================================================
                VIEW MODAL HEADER
            ===================================================== */}

            <div className="sn-modal-header">

              <div>

                <div
                  className="sn-eyebrow"
                  style={{
                    display:
                      "block",
                    marginBottom:
                      "7px",
                  }}
                >
                  CAMPAIGN DETAILS
                </div>

                <h2
                  id="campaign-view-title"
                >
                  {viewCampaign.campaign_name ||
                    "Campaign Details"}
                </h2>

                <p>
                  Read-only campaign
                  information and
                  configuration.
                </p>

              </div>

              <button
                type="button"
                className="sn-modal-close"
                onClick={
                  closeViewCampaign
                }
                title="Close"
                aria-label="Close campaign details"
              >
                <X size={22} />
              </button>

            </div>

            {/* =====================================================
                VIEW BODY
            ===================================================== */}

            <div className="sn-campaign-form">

              {/* ===================================================
                  BASIC INFORMATION
              =================================================== */}

              <div className="sn-form-section">

                <div className="sn-section-title">

                  <div className="sn-section-icon">
                    <Megaphone
                      size={20}
                    />
                  </div>

                  <div>

                    <h3>
                      Campaign Information
                    </h3>

                    <p>
                      Basic information
                      about this
                      campaign.
                    </p>

                  </div>

                </div>

                <div className="sn-form-grid">

                  {/* CAMPAIGN NAME */}

                  <div className="sn-field">

                    <label>
                      Campaign Name
                    </label>

                    <div className="sn-view-value">
                      {viewCampaign.campaign_name ||
                        "-"}
                    </div>

                  </div>

                  {/* CAMPAIGN TYPE */}

                  <div className="sn-field">

                    <label>
                      Campaign Type
                    </label>

                    <div className="sn-view-value">
                      {viewCampaign.campaign_type ||
                        "Announcement"}
                    </div>

                  </div>

                  {/* SUBJECT */}

                  <div className="sn-field">

                    <label>
                      Subject
                    </label>

                    <div className="sn-view-value">
                      {viewCampaign.subject ||
                        "-"}
                    </div>

                  </div>

                  {/* STATUS */}

                  <div className="sn-field">

                    <label>
                      Status
                    </label>

                    <div className="sn-view-status">

                      <span
                        className={getStatusClass(
                          viewCampaign.status
                        )}
                      >

                        <span className="sn-status-dot" />

                        {viewCampaign.status ||
                          "Draft"}

                      </span>

                    </div>

                  </div>

                  {/* CAMPAIGN ID */}

                  <div className="sn-field">

                    <label>
                      Campaign ID
                    </label>

                    <div className="sn-view-value">

                      <Hash
                        size={15}
                      />

                      {viewCampaign.id ||
                        "-"}

                    </div>

                  </div>

                  {/* CREATED DATE */}

                  <div className="sn-field">

                    <label>
                      Created At
                    </label>

                    <div className="sn-view-value">

                      <CalendarDays
                        size={15}
                      />

                      {formatDate(
                        viewCampaign.created_at ||
                          viewCampaign.createdAt
                      )}

                    </div>

                  </div>

                </div>

              </div>

              {/* ===================================================
                  CONTENT
              =================================================== */}

              <div className="sn-form-section">

                <div className="sn-section-title">

                  <div className="sn-section-icon">
                    <FileText
                      size={20}
                    />
                  </div>

                  <div>

                    <h3>
                      Campaign Content
                    </h3>

                    <p>
                      Message content
                      prepared for the
                      selected audience.
                    </p>

                  </div>

                </div>

                <div className="sn-view-content">

                  {viewCampaign.content ||
                    "No campaign content available."}

                </div>

              </div>

              {/* ===================================================
                  AUDIENCE
              =================================================== */}

              <div className="sn-form-section">

                <div className="sn-section-title">

                  <div className="sn-section-icon">
                    <Users
                      size={20}
                    />
                  </div>

                  <div>

                    <h3>
                      Audience
                    </h3>

                    <p>
                      Target audience
                      selected for this
                      campaign.
                    </p>

                  </div>

                </div>

                <div className="sn-form-grid">

                  <div className="sn-field">

                    <label>
                      Audience
                    </label>

                    <div className="sn-view-value">

                      {getCampaignAudience(
                        viewCampaign
                      )?.name ||
                        (viewCampaign.audience_id
                          ? `Audience #${viewCampaign.audience_id}`
                          : "General Public")}

                    </div>

                  </div>

                  <div className="sn-field">

                    <label>
                      Audience ID
                    </label>

                    <div className="sn-view-value">

                      {viewCampaign.audience_id ||
                        "All / General Public"}

                    </div>

                  </div>

                </div>

                {getCampaignAudience(
                  viewCampaign
                ) && (
                  <div
                    className="sn-view-audience-summary"
                  >

                    <strong>
                      {getCampaignAudience(
                        viewCampaign
                      )?.name}
                    </strong>

                    {getCampaignAudience(
                      viewCampaign
                    )?.description && (
                      <span>
                        {
                          getCampaignAudience(
                            viewCampaign
                          ).description
                        }
                      </span>
                    )}

                  </div>
                )}

              </div>

              {/* ===================================================
                  CHANNELS
              =================================================== */}

              <div className="sn-form-section">

                <div className="sn-section-title">

                  <div className="sn-section-icon">
                    <Radio
                      size={20}
                    />
                  </div>

                  <div>

                    <h3>
                      Distribution Channels
                    </h3>

                    <p>
                      Communication
                      channels configured
                      for this campaign.
                    </p>

                  </div>

                </div>

                <div className="sn-view-channel-list">

                  {getCampaignChannels(
                    viewCampaign
                  ).length > 0 ? (
                    getCampaignChannels(
                      viewCampaign
                    ).map(
                      (
                        channel,
                        index
                      ) => (
                        <div
                          className="sn-view-channel"
                          key={`${channel}-${index}`}
                        >

                          <Radio
                            size={17}
                          />

                          <span>
                            {formatChannelName(
                              channel
                            )}
                          </span>

                        </div>
                      )
                    )
                  ) : (
                    <div className="sn-view-empty">
                      No channels configured.
                    </div>
                  )}

                </div>

              </div>

              {/* ===================================================
                  SCHEDULING
              =================================================== */}

              <div className="sn-form-section">

                <div className="sn-section-title">

                  <div className="sn-section-icon">
                    <Clock
                      size={20}
                    />
                  </div>

                  <div>

                    <h3>
                      Scheduling
                    </h3>

                    <p>
                      Campaign scheduling
                      and delivery
                      configuration.
                    </p>

                  </div>

                </div>

                <div className="sn-form-grid">

                  <div className="sn-field">

                    <label>
                      Schedule Time
                    </label>

                    <div className="sn-view-value">

                      <CalendarDays
                        size={15}
                      />

                      {formatDate(
                        viewCampaign.schedule_time
                      )}

                    </div>

                  </div>

                  <div className="sn-field">

                    <label>
                      Frequency
                    </label>

                    <div className="sn-view-value">

                      <Clock
                        size={15}
                      />

                      {formatFrequency(
                        viewCampaign.schedule_frequency
                      )}

                    </div>

                  </div>

                </div>

              </div>

              {/* ===================================================
                  RECIPIENT CONFIGURATION
              =================================================== */}

              <div className="sn-form-section">

                <div className="sn-section-title">

                  <div className="sn-section-icon">
                    <Send
                      size={20}
                    />
                  </div>

                  <div>

                    <h3>
                      Recipient Configuration
                    </h3>

                    <p>
                      Delivery recipient
                      information associated
                      with this campaign.
                    </p>

                  </div>

                </div>

                {viewCampaign.recipients &&
                typeof viewCampaign.recipients ===
                  "object" &&
                Object.keys(
                  viewCampaign.recipients
                ).length > 0 ? (

                  <div className="sn-view-recipient-list">

                    {Object.entries(
                      viewCampaign.recipients
                    ).map(
                      ([
                        channel,
                        recipient,
                      ]) => (

                        <div
                          className="sn-view-recipient"
                          key={channel}
                        >

                          <strong>
                            {formatChannelName(
                              channel
                            )}
                          </strong>

                          <span>
                            {String(
                              recipient
                            )}
                          </span>

                        </div>

                      )
                    )}

                  </div>

                ) : (

                  <div className="sn-view-empty">
                    No recipient configuration
                    is stored for this campaign.
                  </div>

                )}

              </div>

            </div>

            {/* =====================================================
                VIEW MODAL FOOTER
            ===================================================== */}

            <div
              className="sn-modal-footer"
            >

              <button
                type="button"
                className="sn-cancel-button"
                onClick={
                  closeViewCampaign
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ============================================================
          DELIVERY MODAL
      ============================================================ */}

      {deliveryCampaign && (
        <div
          className="campaign-delivery-overlay"
          role="dialog"
          aria-modal="true"
        >

          <div className="campaign-delivery-modal">

            <div className="campaign-delivery-header">

              <div>

                <div className="campaign-delivery-eyebrow">
                  MULTI-CHANNEL DELIVERY
                </div>

                <h2>
                  Send Campaign
                </h2>

                <p>
                  {deliveryCampaign.campaign_name}
                </p>

              </div>

              <button
                type="button"
                className="campaign-delivery-close"
                onClick={
                  closeDelivery
                }
                disabled={
                  sendingCampaign
                }
              >
                <X size={19} />
              </button>

            </div>

            <div className="campaign-delivery-body">

              <div className="campaign-delivery-summary">

                <strong>
                  {deliveryCampaign.subject}
                </strong>

                <span>
                  {deliveryCampaign.content}
                </span>

              </div>

              <label>
                Delivery Channels
              </label>

              <div className="campaign-channel-grid">

                {[
                  [
                    "email",
                    "Email",
                    Mail,
                  ],
                  [
                    "sms",
                    "SMS",
                    Smartphone,
                  ],
                  [
                    "whatsapp",
                    "WhatsApp",
                    MessageSquare,
                  ],
                  [
                    "push",
                    "Push Notification",
                    Bell,
                  ],
                  [
                    "web_broadcast",
                    "Web Broadcast",
                    Globe2,
                  ],
                ].map(
                  ([
                    value,
                    label,
                    Icon,
                  ]) => (

                    <button
                      key={value}
                      type="button"
                      className={`campaign-channel-card ${
                        deliveryChannels.includes(
                          value
                        )
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        toggleDeliveryChannel(
                          value
                        )
                      }
                      disabled={
                        sendingCampaign
                      }
                    >

                      <Icon
                        size={18}
                      />

                      <span>
                        {label}
                      </span>

                      {deliveryChannels.includes(
                        value
                      ) && (
                        <span className="campaign-channel-check">
                          ✓
                        </span>
                      )}

                    </button>

                  )
                )}

              </div>

              <div className="campaign-recipient-grid">

                {deliveryChannels
                  .filter(
                    (item) =>
                      item !==
                      "web_broadcast"
                  )
                  .map(
                    (channel) => (

                      <div
                        key={channel}
                      >

                        <label>

                          {channel ===
                          "push"
                            ? "FCM token"
                            : `${channel.replace(
                                "_",
                                " "
                              )} recipient`}

                        </label>

                        <input
                          type={
                            channel ===
                            "email"
                              ? "email"
                              : "text"
                          }
                          value={
                            deliveryRecipients[
                              channel
                            ] || ""
                          }
                          onChange={(
                            event
                          ) =>
                            setDeliveryRecipients(
                              (
                                previous
                              ) => ({
                                ...previous,
                                [channel]:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          placeholder={
                            channel ===
                            "email"
                              ? "recipient@example.com"
                              : channel ===
                                "push"
                              ? "FCM registration token"
                              : "+919876543210"
                          }
                          disabled={
                            sendingCampaign
                          }
                        />

                      </div>

                    )
                  )}

              </div>

              <div className="campaign-delivery-warning">

                This uses your configured
                real delivery gateways.
                No simulation is used here.

              </div>

            </div>

            <div className="campaign-delivery-footer">

              <button
                type="button"
                className="campaign-delivery-cancel"
                onClick={
                  closeDelivery
                }
                disabled={
                  sendingCampaign
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="campaign-delivery-send"
                onClick={
                  sendCampaign
                }
                disabled={
                  sendingCampaign
                }
              >

                <Send
                  size={17}
                />

                {sendingCampaign
                  ? "Sending..."
                  : "Send Selected Channels"}

              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}