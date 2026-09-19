import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Menu,
  Search,
  Bell,
  CheckCheck,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import api from "../services/api";
import campaignService from "../services/campaignService";
import audienceService from "../services/audienceService";
import templateService from "../services/templateService";
import { useAuth } from "../hooks/useAuth";


const Navbar = ({ onMenuClick }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // ============================================================
  // GLOBAL SEARCH
  // ============================================================

  const searchInputRef = useRef(null);
  const searchWrapRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchData, setSearchData] = useState({
    campaigns: [],
    audiences: [],
    templates: [],
  });
  const [searchLoaded, setSearchLoaded] = useState(false);


  // ============================================================
  // LOAD GLOBAL SEARCH DATA
  // ============================================================

  const loadSearchData = async () => {
    if (searchLoaded || searchLoading) {
      return;
    }

    setSearchLoading(true);

    try {
      const results = await Promise.allSettled([
        campaignService.getAll(),
        audienceService.getAll(),
        templateService.getAll(),
      ]);

      const getValue = (result) => {
        if (result.status !== "fulfilled") {
          return [];
        }

        const value = result.value;

        if (Array.isArray(value)) {
          return value;
        }

        if (Array.isArray(value?.items)) {
          return value.items;
        }

        if (Array.isArray(value?.data)) {
          return value.data;
        }

        return [];
      };

      setSearchData({
        campaigns: getValue(results[0]),
        audiences: getValue(results[1]),
        templates: getValue(results[2]),
      });

      setSearchLoaded(true);

    } catch (error) {
      console.error(
        "Failed to load global search data:",
        error.response?.data || error.message
      );

    } finally {
      setSearchLoading(false);
    }
  };


  // ============================================================
  // GLOBAL SEARCH RESULTS
  // ============================================================

  const normalizeSearchValue = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  const getSearchText = (item) =>
    [
      item?.name,
      item?.campaign_name,
      item?.template_name,
      item?.subject,
      item?.content,
      item?.message,
      item?.description,
      item?.audience_type,
      item?.state,
      item?.language,
      item?.occupation,
      item?.campaign_type,
      item?.status,
    ]
      .filter(Boolean)
      .join(" ");

  const searchTerm = normalizeSearchValue(searchQuery);

  const searchResults = searchTerm.length < 2
    ? []
    : [
        ...searchData.campaigns
          .filter((item) =>
            normalizeSearchValue(
              getSearchText(item)
            ).includes(searchTerm)
          )
          .map((item) => ({
  id: `campaign-${item.id}`,
  type: "Campaign",
  title:
    item.campaign_name ||
    item.name ||
    `Campaign #${item.id}`,
  description:
    item.subject ||
    item.status ||
    "Campaign",
  path: "/campaign",
  targetId: item.id,
})),

        ...searchData.audiences
          .filter((item) =>
            normalizeSearchValue(
              getSearchText(item)
            ).includes(searchTerm)
          )
          .map((item) => ({
            id: `audience-${item.id}`,
            type: "Audience",
            title:
              item.name ||
              `Audience #${item.id}`,
            description:
              item.audience_type ||
              item.state ||
              "Audience group",
            path: "/audience",
            targetId: item.id,
          })),

        ...searchData.templates
          .filter((item) =>
            normalizeSearchValue(
              getSearchText(item)
            ).includes(searchTerm)
          )
          .map((item) => ({
            id: `template-${item.id}`,
            type: "Template",
            title:
              item.name ||
              item.template_name ||
              `Template #${item.id}`,
            description:
              item.template_type ||
              item.type ||
              "Message template",
            path: "/templates",
            targetId: item.id,
          })),
      ].slice(0, 8);


  // ============================================================
  // SEARCH RESULT NAVIGATION
  // ============================================================

  const handleSearchResultClick = (result) => {
    setSearchQuery("");
    setShowSearchResults(false);

    let targetQuery = "";

    if (result?.type === "Campaign" && result?.targetId) {
      targetQuery = `?campaignId=${encodeURIComponent(
        result.targetId
      )}`;
    } else if (
      result?.type === "Audience" &&
      result?.targetId
    ) {
      targetQuery = `?audienceId=${encodeURIComponent(
        result.targetId
      )}`;
    } else if (
      result?.type === "Template" &&
      result?.targetId
    ) {
      targetQuery = `?templateId=${encodeURIComponent(
        result.targetId
      )}`;
    }

    navigate(`${result.path}${targetQuery}`);
  };

  // ============================================================
  // SEARCH KEYBOARD SUPPORT
  // ============================================================

  useEffect(() => {
    const handleGlobalSearchShortcut = (event) => {
      const target = event.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchResults(true);
      }

      if (event.key === "Escape") {
        setShowSearchResults(false);
        searchInputRef.current?.blur();
      }
    };

    const handleOutsideSearchClick = (event) => {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(event.target)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleGlobalSearchShortcut
    );

    document.addEventListener(
      "mousedown",
      handleOutsideSearchClick
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleGlobalSearchShortcut
      );

      document.removeEventListener(
        "mousedown",
        handleOutsideSearchClick
      );
    };
  }, []);


  // ============================================================
  // LOAD UNREAD COUNT
  // ============================================================

  const loadUnreadCount = async () => {
    try {
      const response = await api.get(
        "/notifications/unread-count"
      );

      setUnreadCount(
        response.data?.count || 0
      );

    } catch (error) {
      console.error(
        "Failed to load notification count:",
        error.response?.data || error.message
      );
    }
  };


  // ============================================================
  // LOAD NOTIFICATIONS
  // ============================================================

  const loadNotifications = async () => {
    setLoadingNotifications(true);

    try {
      const response = await api.get(
        "/notifications/"
      );

      const data = response.data || [];

      setNotifications(data);

      const unread = data.filter(
        (notification) =>
          !notification.is_read
      ).length;

      setUnreadCount(unread);

    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error.response?.data || error.message
      );

    } finally {
      setLoadingNotifications(false);
    }
  };


  // ============================================================
  // INITIAL LOAD + BACKUP REFRESH
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const fetchUnreadCount = async () => {
      try {
        const response = await api.get(
          "/notifications/unread-count"
        );

        if (!cancelled) {
          setUnreadCount(
            response.data?.count || 0
          );
        }

      } catch (error) {
        if (!cancelled) {
          console.error(
            "Failed to load notification count:",
            error.response?.data ||
              error.message
          );
        }
      }
    };


    fetchUnreadCount();


    const interval = setInterval(
      () => {
        loadUnreadCount();
      },
      30000
    );


    return () => {
      cancelled = true;
      clearInterval(interval);
    };

  }, []);


  // ============================================================
  // REAL-TIME FCM UPDATE
  // ============================================================

  useEffect(() => {

    const handleFCMNotification = async () => {

      console.log(
        "Navbar: FCM notification received"
      );


      // Immediately update badge

      await loadUnreadCount();


      // If dropdown is open,
      // refresh its notification list

      if (showNotifications) {
        await loadNotifications();
      }

    };


    window.addEventListener(
      "fcm-notification-received",
      handleFCMNotification
    );


    return () => {

      window.removeEventListener(
        "fcm-notification-received",
        handleFCMNotification
      );

    };

  }, [showNotifications]);


  // ============================================================
  // TOGGLE NOTIFICATION DROPDOWN
  // ============================================================

  const handleNotificationClick = async () => {

    const nextState =
      !showNotifications;

    setShowNotifications(
      nextState
    );


    if (nextState) {
      await loadNotifications();
    }

  };


  // ============================================================
  // MARK ONE NOTIFICATION AS READ
  // ============================================================

  const markAsRead = async (
    notificationId
  ) => {

    try {

      await api.put(
        `/notifications/${notificationId}/read`
      );


      setNotifications(
        (previous) =>
          previous.map(
            (notification) =>
              notification.id ===
              notificationId
                ? {
                    ...notification,
                    is_read: true,
                  }
                : notification
          )
      );


      setUnreadCount(
        (previous) =>
          Math.max(
            0,
            previous - 1
          )
      );

    } catch (error) {

      console.error(
        "Failed to mark notification as read:",
        error.response?.data ||
          error.message
      );

    }

  };


  // ============================================================
  // MARK ALL AS READ
  // ============================================================

  const markAllAsRead = async () => {

    try {

      await api.put(
        "/notifications/read-all"
      );


      setNotifications(
        (previous) =>
          previous.map(
            (notification) => ({
              ...notification,
              is_read: true,
            })
          )
      );


      setUnreadCount(0);

    } catch (error) {

      console.error(
        "Failed to mark all notifications as read:",
        error.response?.data ||
          error.message
      );

    }

  };


  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatNotificationTime = (dateString) => {
    if (!dateString) {
      return "";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    // Backend stores timestamps in UTC.
    // If the API returns a timestamp without timezone,
    // explicitly treat it as UTC.
    const normalizedDateString =
      !dateString.endsWith("Z") &&
      !dateString.includes("+")
        ? `${dateString}Z`
        : dateString;

    const utcDate = new Date(normalizedDateString);

    if (Number.isNaN(utcDate.getTime())) {
      return "";
    }

    return utcDate.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };


  // ============================================================
  // ACCOUNT / ROLE
  // ============================================================

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout();
    navigate("/");
  };

  const roleLabel =
    currentUser?.role === "Admin"
      ? "Administrator"
      : currentUser?.role || "Workspace";

  const displayName =
    currentUser?.name ||
    currentUser?.email?.split("@")[0] ||
    "User";


  // ============================================================
  // UI
  // ============================================================

  return (
    <header className="sn-topbar">

      {/* ======================================================
          LEFT SIDE
      ======================================================= */}

      <div className="sn-topbar-left">

        <button
          type="button"
          className="sn-menu-button"
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <Menu size={22} />
        </button>


        <div className="sn-brand">

          <div className="sn-brand-mark">
            SN
          </div>

          <div className="sn-brand-copy">

            <h1 className="sn-brand-name">
              SmartNotify
            </h1>

            <span className="sn-brand-status">
              Communication Platform
            </span>

          </div>

        </div>

      </div>


      {/* ======================================================
          CENTER SEARCH
      ======================================================= */}

      <div
        ref={searchWrapRef}
        className="sn-navbar-search"
        style={{ position: "relative" }}
      >

        <Search
          size={18}
          className="sn-navbar-search-icon"
        />

        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search campaigns, audiences, templates..."
          aria-label="Search campaigns, audiences, templates"
          value={searchQuery}
          onFocus={() => {
            setShowSearchResults(true);
            loadSearchData();
          }}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setShowSearchResults(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setShowSearchResults(false);
            }

            if (event.key === "Enter" && searchResults.length > 0) {
              handleSearchResultClick(searchResults[0]);
            }
          }}
        />
        {searchQuery && (
  <button
    type="button"
    onClick={() => setSearchQuery("")}
    className="sn-navbar-search-clear"
    aria-label="Clear search"
    title="Clear search"
  >
    ×
  </button>
)}

        {!searchQuery && (
          <span className="sn-search-shortcut">
            /
          </span>
        )}

        {showSearchResults && searchQuery.trim().length >= 2 && (
          <div
            role="listbox"
            aria-label="Global search results"
            style={{
              position: "absolute",
              top: "calc(100% + 10px)",
              left: 0,
              right: 0,
              zIndex: 1000,
              padding: "8px",
              border: "1px solid #e1e8f1",
              borderRadius: "14px",
              background: "#ffffff",
              boxShadow: "0 18px 45px rgba(15, 23, 42, 0.14)",
            }}
          >
            {searchLoading && !searchLoaded ? (
              <div
                style={{
                  padding: "14px 12px",
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  role="option"
                  onClick={() =>
                    handleSearchResultClick(result)
                  }
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "11px",
                    padding: "10px 11px",
                    border: 0,
                    borderRadius: "10px",
                    background: "transparent",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = "#f5f8fc";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = "transparent";
                  }}
                >
                  <span
                    style={{
                      width: "30px",
                      height: "30px",
                      flex: "0 0 30px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "9px",
                      background: "#eef4ff",
                      color: "#2563eb",
                      fontSize: "10px",
                      fontWeight: 800,
                    }}
                  >
                    {result.type.charAt(0)}
                  </span>

                  <span
                    style={{
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <strong
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "#0b1730",
                        fontSize: "13px",
                      }}
                    >
                      {result.title}
                    </strong>

                    <span
                      style={{
                        color: "#7c8da5",
                        fontSize: "11px",
                      }}
                    >
                      {result.type} · {result.description}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <div
                style={{
                  padding: "14px 12px",
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                No campaigns, audiences, or templates found.
              </div>
            )}
          </div>
        )}

      </div>


      {/* ======================================================
          RIGHT SIDE
      ======================================================= */}

      <div className="sn-topbar-right">


        {/* SEARCH BUTTON
            Kept for responsive/mobile compatibility.
        */}

        <button
          type="button"
          className="sn-icon-button sn-mobile-search"
          aria-label="Search"
          title="Search"
          onClick={() => {
            searchInputRef.current?.focus();
            setShowSearchResults(true);
            loadSearchData();
          }}
        >
          <Search size={21} />
        </button>


        {/* ====================================================
            NOTIFICATION BELL
        ===================================================== */}

        <div className="sn-notification-wrap">

          <button
            type="button"
            className="sn-icon-button sn-notification-button"
            aria-label="Notifications"
            title="Notifications"
            onClick={
              handleNotificationClick
            }
          >

            <Bell size={21} />


            {/* UNREAD BADGE */}

            {unreadCount > 0 && (

              <span className="sn-notification-badge">

                {unreadCount > 99
                  ? "99+"
                  : unreadCount}

              </span>

            )}

          </button>


          {/* ==================================================
              NOTIFICATION DROPDOWN
          =================================================== */}

          {showNotifications && (

            <div className="sn-notification-panel">


              {/* HEADER */}

              <div className="sn-notification-header">

                <div>

                  <div className="sn-notification-title-row">

                    <strong>
                      Notifications
                    </strong>

                    {unreadCount > 0 && (

                      <span className="sn-notification-count">
                        {unreadCount} unread
                      </span>

                    )}

                  </div>

                  <span className="sn-notification-subtitle">
                    Recent activity from SmartNotify
                  </span>

                </div>


                {unreadCount > 0 && (

                  <button
                    type="button"
                    onClick={
                      markAllAsRead
                    }
                    className="sn-mark-all-button"
                  >

                    <CheckCheck
                      size={15}
                    />

                    Mark all read

                  </button>

                )}

              </div>


              {/* NOTIFICATION LIST */}

              <div className="sn-notification-list">

                {loadingNotifications ? (

                  <div className="sn-notification-empty">

                    <div className="sn-notification-loading-dot" />

                    <span>
                      Loading notifications...
                    </span>

                  </div>

                ) : notifications.length === 0 ? (

                  <div className="sn-notification-empty">

                    <div className="sn-notification-empty-icon">
                      <Bell size={23} />
                    </div>

                    <strong>
                      No notifications
                    </strong>

                    <span>
                      You're all caught up.
                    </span>

                  </div>

                ) : (

                  notifications.map(
                    (notification) => (

                      <div
                        key={
                          notification.id
                        }
                        onClick={() => {

                          if (
                            !notification.is_read
                          ) {

                            markAsRead(
                              notification.id
                            );

                          }

                        }}
                        className={`sn-notification-item ${
                          notification.is_read
                            ? "read"
                            : "unread"
                        }`}
                      >

                        {/* UNREAD DOT */}

                        <div
                          className={`sn-notification-dot ${
                            notification.is_read
                              ? "read"
                              : ""
                          }`}
                        />


                        {/* CONTENT */}

                        <div className="sn-notification-content">

                          <div className="sn-notification-item-title">

                            {
                              notification.title
                            }

                          </div>


                          <div className="sn-notification-item-message">

                            {
                              notification.message
                            }

                          </div>


                          <div className="sn-notification-item-time">

                            {formatNotificationTime(
                              notification.created_at
                            )}

                          </div>

                        </div>

                      </div>

                    )
                  )

                )}

              </div>

            </div>

          )}

        </div>


        {/* ====================================================
            ROLE + PROFILE
        ===================================================== */}

        <div className="sn-account-cluster">

          <div
            className="sn-role-badge"
            title="Your assigned workspace role"
          >

            <ShieldCheck size={15} />

            <span>
              {roleLabel}
            </span>

          </div>


          <div className="sn-profile-wrap">

            <button
              type="button"
              className="sn-profile-button"
              aria-label="Open profile menu"
              title={displayName}
              onClick={() =>
                setShowProfileMenu(
                  (value) => !value
                )
              }
            >

              <div className="sn-profile-avatar-small">
                {displayName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="sn-profile-name-wrap">

                <strong>
                  {displayName}
                </strong>

                <span>
                  {roleLabel}
                </span>

              </div>

              <ChevronDown
                size={15}
                className={`sn-profile-chevron ${
                  showProfileMenu
                    ? "open"
                    : ""
                }`}
              />

            </button>


            {showProfileMenu && (

              <div className="sn-profile-menu">

                <div className="sn-profile-menu-header">

                  <div className="sn-profile-avatar">

                    {displayName
                      .charAt(0)
                      .toUpperCase()}

                  </div>


                  <div className="sn-profile-meta">

                    <strong>
                      {displayName}
                    </strong>

                    <span>
                      {currentUser?.email || ""}
                    </span>

                    <small>
                      {roleLabel}
                    </small>

                  </div>

                </div>


                <div className="sn-profile-divider" />


                <button
                  type="button"
                  className="sn-profile-logout"
                  onClick={
                    handleLogout
                  }
                >

                  Logout

                </button>

              </div>

            )}

          </div>

        </div>

      </div>

    </header>
  );
};


export default Navbar;