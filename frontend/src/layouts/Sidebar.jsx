import {
  Home,
  Users,
  Megaphone,
  Sparkles,
  FileText,
  BarChart3,
  Settings,
  X,
  CircleUserRound,
  RadioTower,
  Activity,
  MessageSquareText,
  Info,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getNavigationForRole } from "../utils/roleConfig";

const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();

  // ============================================================
  // CURRENT USER ROLE
  // ============================================================

  const role = String(
    currentUser?.role || ""
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  // ============================================================
  // CANONICAL ROLE MAPPING
  //
  // roleConfig.js uses:
  //
  // Admin
  // Campaign Manager
  // Communication Team
  // ============================================================

  const canonicalRoleMap = {
    admin: "Admin",
    campaign_manager: "Campaign Manager",
    communication_team: "Communication Team",
  };

  const navigationRole =
    canonicalRoleMap[role] ||
    currentUser?.role ||
    "";

  // ============================================================
  // ALL AVAILABLE MENU ITEMS
  //
  // This is the complete SmartNotify navigation reference.
  //
  // Navigation visibility comes from roleConfig.js.
  // Permissions are handled separately inside each page/API.
  // ============================================================

  const menuItems = {
    dashboard: {
      name: "Dashboard",
      path: "/dashboard",
      icon: Home,
    },

    audiences: {
      name: "Audiences",
      path: "/audience",
      icon: Users,
    },

    campaigns: {
      name: "Campaigns",
      path: "/campaign",
      icon: Megaphone,
    },

    aiStudio: {
      name: "AI Campaign Studio",
      path: "/ai-studio",
      icon: Sparkles,
    },

    templates: {
      name: "Templates",
      path: "/templates",
      icon: FileText,
    },

    analytics: {
      name: "Analytics",
      path: "/analytics",
      icon: BarChart3,
    },

    delivery: {
      name: "Delivery Tracking",
      path: "/delivery-tracking",
      icon: Activity,
    },

    engagement: {
      name: "Engagement & Feedback",
      path: "/engagement-feedback",
      icon: MessageSquareText,
    },

    channels: {
      name: "Channels",
      path: "/channels",
      icon: RadioTower,
    },

    reports: {
      name: "Reports",
      path: "/reports",
      icon: FileText,
    },

    users: {
      name: "Team Users",
      path: "/users",
      icon: Users,
    },

    settings: {
      name: "Settings",
      path: "/settings",
      icon: Settings,
    },

    about: {
      name: "About SmartNotify",
      path: "/about",
      icon: Info,
    },
  };

  // ============================================================
  // ICON MAP
  //
  // IMPORTANT:
  // Do NOT generate this map dynamically from component.name.
  //
  // roleConfig.js stores icon names as strings such as:
  //
  // "Home"
  // "Users"
  // "Megaphone"
  // "Sparkles"
  // "FileText"
  // "BarChart3"
  // "Activity"
  // "MessageSquareText"
  // "RadioTower"
  // "Settings"
  // "Info"
  //
  // Therefore we explicitly map those strings to the imported
  // Lucide React components.
  // ============================================================

  const iconMap = {
    Home: Home,
    Users: Users,
    Megaphone: Megaphone,
    Sparkles: Sparkles,
    FileText: FileText,
    BarChart3: BarChart3,
    Activity: Activity,
    MessageSquareText: MessageSquareText,
    RadioTower: RadioTower,
    Settings: Settings,
    Info: Info,
  };

  // ============================================================
  // ROLE-BASED NAVIGATION
  //
  // Navigation visibility comes from roleConfig.js.
  //
  // ADMIN
  // - Dashboard
  // - Audiences
  // - Campaigns
  // - AI Campaign Studio
  // - Templates
  // - Analytics
  // - Delivery Tracking
  // - Engagement & Feedback
  // - Channels
  // - Reports
  // - Team Users
  // - Settings
  // - About SmartNotify
  //
  // CAMPAIGN MANAGER
  // - Campaign planning
  // - Audience management
  // - AI content
  // - Templates
  // - Scheduling
  //
  // COMMUNICATION TEAM
  // - Campaign execution
  // - Delivery monitoring
  // - Channel operations
  // - Engagement analytics
  //
  // Actual permissions are handled separately.
  // ============================================================

  const navigationItems =
    getNavigationForRole(
      navigationRole
    );

  // ============================================================
  // CONVERT FLAT NAVIGATION INTO SECTIONS
  // ============================================================

  const sections =
    navigationItems.reduce(
      (groups, item) => {
        const sectionName =
          item.section;

        if (!groups[sectionName]) {
          groups[sectionName] = [];
        }

        // ======================================================
        // GET ICON FROM EXPLICIT ICON MAP
        // ======================================================

        const Icon =
          iconMap[item.icon];

        // ======================================================
        // FALLBACK
        //
        // If roleConfig contains an icon name that is not in
        // iconMap, try to find the corresponding menu item.
        // This keeps menuItems useful and prevents blank icons.
        // ======================================================

        const fallbackMenuItem =
          Object.values(
            menuItems
          ).find(
            (menuItem) =>
              menuItem.name ===
              item.name
          );

        const FinalIcon =
          Icon ||
          fallbackMenuItem?.icon;

        groups[sectionName].push({
          ...item,
          icon: FinalIcon,
        });

        return groups;
      },
      {}
    );

  // ============================================================
  // NAVIGATION SECTIONS
  //
  // Convert the grouped object into an array for rendering.
  // ============================================================

  const navigationSections =
    Object.entries(
      sections
    ).map(
      ([section, items]) => ({
        section,
        items,
      })
    );

  // ============================================================
  // NAVIGATION ITEM RENDERER
  // ============================================================

  const renderMenuItem = (
    item
  ) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.name}
        to={item.path}
        onClick={() => {
          if (
            window.innerWidth <=
            900
          ) {
            onClose();
          }
        }}
        className={({
          isActive,
        }) =>
          `sidebar-link ${
            isActive
              ? "active"
              : ""
          }`
        }
      >

        <span className="sidebar-link-icon">

          {Icon && (
            <Icon
              size={19}
              strokeWidth={2}
            />
          )}

        </span>

        <span className="sidebar-link-label">

          {item.name}

        </span>

        {item.name ===
          "AI Campaign Studio" && (

          <span className="sidebar-ai-badge">
            AI
          </span>

        )}

      </NavLink>
    );
  };

  // ============================================================
  // SIDEBAR
  // ============================================================

  return (
    <>
      <aside
        className={`sidebar ${
          isOpen
            ? "sidebar-open"
            : ""
        }`}
      >

        {/* =====================================================
            SIDEBAR HEADER
        ====================================================== */}

        <div className="sidebar-mobile-header">

          <div className="sidebar-mobile-heading">

            <span className="sidebar-mobile-kicker">
              WORKSPACE
            </span>

            <strong>
              Navigation
            </strong>

          </div>

          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
            type="button"
          >
            <X size={18} />
          </button>

        </div>


        {/* =====================================================
            NAVIGATION
        ====================================================== */}

        <nav className="sidebar-nav">

          {navigationSections.map(
            (section) => (

              <div
                className="sidebar-nav-section"
                key={
                  section.section
                }
              >

                <div
                  className={
                    section.section ===
                    "WORKSPACE"
                      ? "sidebar-section-label"
                      : "sidebar-section-label sidebar-section-gap"
                  }
                >
                  {
                    section.section
                  }
                </div>

                <div className="sidebar-section-items">

                  {section.items.map(
                    renderMenuItem
                  )}

                </div>

              </div>

            )
          )}

        </nav>


        {/* =====================================================
            USER
            Role is intentionally NOT shown here.
            The role is shown beside the profile icon
            in the top navbar.
        ====================================================== */}

        <div className="sidebar-user-card">

          <div className="sidebar-user-avatar">

            {currentUser?.name
              ? currentUser.name
                  .charAt(0)
                  .toUpperCase()
              : (
                <CircleUserRound
                  size={19}
                />
              )}

          </div>


          <div className="sidebar-user-info">

            <strong>

              {currentUser?.name ||
                currentUser?.email?.split(
                  "@"
                )[0] ||
                "SmartNotify User"}

            </strong>


            <span>

              {currentUser?.email ||
                ""}

            </span>

          </div>

        </div>

      </aside>


      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}

      {isOpen && (

        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />

      )}

    </>
  );
};

export default Sidebar;