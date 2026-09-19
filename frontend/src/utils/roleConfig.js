// ============================================================
// SMARTNOTIFY ROLE CONFIGURATION
// Dashboard + navigation + UI capability rules only.
// Backend authorization remains the final security boundary.
// ============================================================

export const ROLES = {
  ADMIN: "Admin",
  CAMPAIGN_MANAGER: "Campaign Manager",
  COMMUNICATION_TEAM: "Communication Team",
};

export const ALL_ROLES = [
  ROLES.ADMIN,
  ROLES.CAMPAIGN_MANAGER,
  ROLES.COMMUNICATION_TEAM,
];

export const ROLE_META = {
  [ROLES.ADMIN]: {
    label: "Administrator",
    workspace: "Platform Administration",
    description:
      "Manage users and platform settings with workspace-wide visibility and oversight.",
  },

  [ROLES.CAMPAIGN_MANAGER]: {
    label: "Campaign Manager",
    workspace: "Campaign Management",
    description:
      "Plan campaigns, manage audiences, create content and schedule communications.",
  },

  [ROLES.COMMUNICATION_TEAM]: {
    label: "Communication Team",
    workspace: "Communication Operations",
    description:
      "Execute approved communications and monitor delivery across channels.",
  },
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    manageUsers: true,
    // Admin has platform-wide VIEW access to workspace data.
    // Campaign/audience/template/channel mutations remain owned by
    // their respective backend roles, so the UI does not expose
    // controls that would intentionally return 403/401.
    manageCampaigns: false,
    manageAudiences: false,
    useAIStudio: false,
    manageTemplates: false,
    operateChannels: false,
    monitorDelivery: true,
    retryDelivery: false,
    viewAnalytics: true,
    viewReports: true,
    manageSettings: true,
    viewFeedback: true,
  },

  [ROLES.CAMPAIGN_MANAGER]: {
    manageUsers: false,
    manageCampaigns: true,
    manageAudiences: true,
    useAIStudio: true,
    manageTemplates: true,
    operateChannels: false,
    monitorDelivery: true,
    retryDelivery: false,
    viewAnalytics: true,
    viewReports: true,
    manageSettings: false,
    viewFeedback: true,
  },

  [ROLES.COMMUNICATION_TEAM]: {
    manageUsers: false,
    manageCampaigns: false,
    manageAudiences: false,
    useAIStudio: false,
    manageTemplates: false,
    operateChannels: true,
    monitorDelivery: true,
    retryDelivery: true,
    viewAnalytics: true,
    viewReports: true,
    manageSettings: false,
    viewFeedback: true,
  },
};

export const getRoleMeta = (role) =>
  ROLE_META[role] || {
    label: "SmartNotify User",
    workspace: "SmartNotify Workspace",
    description: "SmartNotify communication workspace.",
  };

export const getRolePermissions = (role) =>
  ROLE_PERMISSIONS[role] || {};

export const hasPermission = (role, permission) =>
  Boolean(
    ROLE_PERMISSIONS[role]?.[permission]
  );

export const roleCanAccess = (role, allowedRoles) =>
  !allowedRoles?.length ||
  allowedRoles.includes(role);

// ============================================================
// SIDEBAR CONFIGURATION
// Keep existing paths. Only visibility changes by role.
// ============================================================

export const NAVIGATION_ITEMS = [
  {
    name: "Dashboard",
    path: "/dashboard",
    section: "WORKSPACE",
    icon: "Home",
    roles: ALL_ROLES,
  },
  {
    name: "Audiences",
    path: "/audience",
    section: "WORKSPACE",
    icon: "Users",
    roles: ALL_ROLES,
  },
  {
    name: "Campaigns",
    path: "/campaign",
    section: "WORKSPACE",
    icon: "Megaphone",
    roles: ALL_ROLES,
  },
  {
    name: "AI Campaign Studio",
    path: "/ai-studio",
    section: "CREATE & MANAGE",
    icon: "Sparkles",
    badge: "AI",
    roles: [
      ROLES.ADMIN,
      ROLES.CAMPAIGN_MANAGER,
    ],
  },
  {
    name: "Templates",
    path: "/templates",
    section: "CREATE & MANAGE",
    icon: "FileText",
    roles: ALL_ROLES,
  },
  {
    name: "Analytics",
    path: "/analytics",
    section: "INSIGHTS",
    icon: "BarChart3",
    roles: ALL_ROLES,
  },
  {
    name: "Delivery Tracking",
    path: "/delivery-tracking",
    section: "INSIGHTS",
    icon: "Activity",
    roles: ALL_ROLES,
  },
  {
    name: "Engagement & Feedback",
    path: "/engagement-feedback",
    section: "INSIGHTS",
    icon: "MessageSquareText",
    roles: ALL_ROLES,
  },
  {
    name: "Channels",
    path: "/channels",
    section: "OPERATIONS",
    icon: "RadioTower",
    roles: ALL_ROLES,
  },
  {
    name: "Reports",
    path: "/reports",
    section: "INSIGHTS",
    icon: "FileText",
    roles: ALL_ROLES,
  },
  {
    name: "Team Users",
    path: "/users",
    section: "ADMINISTRATION",
    icon: "Users",
    roles: [ROLES.ADMIN],
  },
  {
    name: "Settings",
    path: "/settings",
    section: "ADMINISTRATION",
    icon: "Settings",
    roles: [ROLES.ADMIN],
  },
  {
    name: "About SmartNotify",
    path: "/about",
    section: "HELP & PLATFORM",
    icon: "Info",
    roles: ALL_ROLES,
  },
];

export const getNavigationForRole = (role) =>
  NAVIGATION_ITEMS.filter((item) =>
    item.roles.includes(role)
  );
