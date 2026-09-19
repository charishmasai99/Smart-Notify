import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  FileText,
  Megaphone,
  RadioTower,
  Send,
  Settings,
  Sparkles,
  Target,
  Users,
  UserCog,
  AlertTriangle,
  Clock3,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import dashboardService from "../../services/dashboardService";
import { useAuth } from "../../hooks/useAuth";
import {
  ROLES,
  getRoleMeta,
} from "../../utils/roleConfig";

import "./RoleDashboard.css";

const number = (value) =>
  new Intl.NumberFormat("en-IN").format(
    Number(value) || 0
  );

const percentage = (value) =>
  `${Number(value || 0).toFixed(1)}%`;

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "blue",
}) {
  return (
    <div className={`role-stat-card ${tone}`}>
      <div className="role-stat-icon">
        <Icon size={20} />
      </div>

      <div className="role-stat-content">
        <span>{label}</span>
        <strong>{value}</strong>
        {detail && <small>{detail}</small>}
      </div>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  action,
  onClick,
}) {
  return (
    <button
      type="button"
      className="role-action-card"
      onClick={onClick}
    >
      <div className="role-action-icon">
        <Icon size={21} />
      </div>

      <div className="role-action-copy">
        <strong>{title}</strong>
        <span>{description}</span>
        <b>{action} →</b>
      </div>
    </button>
  );
}


const CHART_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#64748b",
];

const CHANNEL_LABELS = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
  push: "Push Notification",
  web_broadcast: "Web Broadcast",
};

function PanelHeader({ eyebrow, title, action, onAction }) {
  return (
    <div className="role-visual-header">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action && (
        <button type="button" onClick={onAction} className="role-visual-action">
          {action}
        </button>
      )}
    </div>
  );
}

function VisualCard({ className = "", children }) {
  return <section className={`role-visual-card ${className}`}>{children}</section>;
}

function ChannelLegend({ data }) {
  const entries = Object.entries(data || {}).filter(([, value]) => Number(value) > 0);
  const total = entries.reduce((sum, [, value]) => sum + Number(value || 0), 0);

  if (!entries.length) {
    return (
      <div className="role-chart-empty">
        <RadioTower size={26} />
        <strong>No channel activity yet</strong>
        <span>Channel performance will appear here when deliveries are recorded.</span>
      </div>
    );
  }

  return (
    <div className="role-channel-legend">
      {entries.map(([channel, value], index) => {
        const percentageValue = total ? Math.round((Number(value) / total) * 100) : 0;
        return (
          <div className="role-channel-row" key={channel}>
            <div className="role-channel-name">
              <i style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
              <span>{CHANNEL_LABELS[channel] || channel}</span>
            </div>
            <strong>{percentageValue}%</strong>
          </div>
        );
      })}
    </div>
  );
}

export default function RoleDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = currentUser?.role;
  const meta = getRoleMeta(role);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [dashboardData, deliveryData] =
          await Promise.all([
            dashboardService.getDashboard(),
            dashboardService.getDeliveryAnalytics(),
          ]);

        if (!cancelled) {
          setDashboard(dashboardData || {});
          setDelivery(deliveryData || {});
        }
      } catch (err) {
        console.error(
          "Role dashboard load error:",
          err
        );

        if (!cancelled) {
          setError(
            err?.response?.data?.detail ||
              "Unable to load workspace dashboard."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const status = useMemo(
    () => dashboard?.campaign_status || {},
    [dashboard?.campaign_status]
  );

  const activeCampaigns =
    Number(status.approved || 0) +
    Number(status.scheduled || 0) +
    Number(status.sending || 0);

  const delivered =
    Number(delivery?.delivered || 0);

  const failed =
    Number(delivery?.failed || 0);

  const totalMessages =
    Number(delivery?.total_messages || 0);

  const roleCards = useMemo(() => {
    if (role === ROLES.ADMIN) {
      return [
        {
          icon: Users,
          label: "Platform Users",
          value: number(dashboard?.users),
          detail: "All registered users",
          tone: "purple",
        },
        {
          icon: Target,
          label: "Audience Groups",
          value: number(dashboard?.audience),
          detail: "Available segments",
          tone: "blue",
        },
        {
          icon: Megaphone,
          label: "Total Campaigns",
          value: number(dashboard?.campaigns),
          detail: `${number(activeCampaigns)} active / scheduled`,
          tone: "green",
        },
        {
          icon: FileText,
          label: "Templates",
          value: number(dashboard?.templates),
          detail: "Reusable communication templates",
          tone: "orange",
        },
        {
          icon: Send,
          label: "Messages Sent",
          value: number(delivery?.sent),
          detail: `${number(delivery?.delivered)} delivered`,
          tone: "blue",
        },
        {
          icon: CheckCircle2,
          label: "Delivery Rate",
          value: percentage(delivery?.delivery_rate),
          detail: `${number(delivery?.failed)} failed`,
          tone: "green",
        },
      ];
    }

    if (role === ROLES.CAMPAIGN_MANAGER) {
      return [
        {
          icon: Megaphone,
          label: "Total Campaigns",
          value: number(dashboard?.campaigns),
          detail: `${number(activeCampaigns)} active / scheduled`,
          tone: "blue",
        },
        {
          icon: Clock3,
          label: "Scheduled",
          value: number(status.scheduled),
          detail: "Waiting for execution",
          tone: "purple",
        },
        {
          icon: Target,
          label: "Audiences",
          value: number(dashboard?.audience),
          detail: "Target segments",
          tone: "green",
        },
        {
          icon: FileText,
          label: "Templates",
          value: number(dashboard?.templates),
          detail: "Reusable content",
          tone: "orange",
        },
        {
          icon: Send,
          label: "Messages Sent",
          value: number(delivery?.sent),
          detail: "Across your campaigns",
          tone: "blue",
        },
        {
          icon: CheckCircle2,
          label: "Delivery Rate",
          value: percentage(delivery?.delivery_rate),
          detail: "Latest delivery performance",
          tone: "green",
        },
      ];
    }

    return [
      {
        icon: Send,
        label: "Messages",
        value: number(totalMessages),
        detail: "Tracked deliveries",
        tone: "blue",
      },
      {
        icon: CheckCircle2,
        label: "Delivered",
        value: number(delivered),
        detail: percentage(delivery?.delivery_rate),
        tone: "green",
      },
      {
        icon: AlertTriangle,
        label: "Failed",
        value: number(failed),
        detail: "Requires attention",
        tone: "red",
      },
      {
        icon: Activity,
        label: "Engagement",
        value: percentage(
          delivery?.engagement_rate
        ),
        detail: `${number(delivery?.opened)} opened`,
        tone: "purple",
      },
      {
        icon: Clock3,
        label: "Clicked",
        value: number(delivery?.clicked),
        detail: `${number(delivery?.total_clicks)} total clicks`,
        tone: "orange",
      },
      {
        icon: CheckCircle2,
        label: "Delivery Rate",
        value: percentage(delivery?.delivery_rate),
        detail: "Current channel performance",
        tone: "green",
      },
    ];
  }, [
    role,
    dashboard,
    status.scheduled,
    activeCampaigns,
    delivery,
    totalMessages,
    delivered,
    failed,
  ]);


  const campaignStatusData = useMemo(() => [
    { name: "Draft", value: Number(status.draft || 0) },
    { name: "Pending Review", value: Number(status.pending_review || 0) },
    { name: "Approved", value: Number(status.approved || 0) },
    { name: "Scheduled", value: Number(status.scheduled || 0) },
    { name: "Sending", value: Number(status.sending || 0) },
    { name: "Completed", value: Number(status.completed || 0) },
    { name: "Rejected", value: Number(status.rejected || 0) },
  ].filter((item) => item.value > 0), [status]);

  const deliveryStatusData = useMemo(() => [
    { name: "Sent", value: Number(delivery?.sent || 0) },
    { name: "Delivered", value: Number(delivery?.delivered || 0) },
    { name: "Opened", value: Number(delivery?.opened || 0) },
    { name: "Clicked", value: Number(delivery?.clicked || 0) },
    { name: "Failed", value: Number(delivery?.failed || 0) },
  ].filter((item) => item.value > 0), [delivery]);

  const channelData = useMemo(() => {
    const source = delivery?.channels || dashboard?.delivery_channels || {};
    return Object.entries(source)
      .map(([channel, value]) => ({
        name: CHANNEL_LABELS[channel] || channel,
        channel,
        value: Number(value?.messages ?? value ?? 0),
      }))
      .filter((item) => item.value > 0);
  }, [dashboard, delivery]);

  const campaignChannelData = useMemo(() => {
    return Object.entries(dashboard?.campaign_channels || {})
      .map(([channel, value]) => ({
        name: CHANNEL_LABELS[channel] || channel,
        value: Number(value || 0),
      }))
      .filter((item) => item.value > 0);
  }, [dashboard]);

  const scheduledCampaigns = Array.isArray(dashboard?.scheduled_campaigns)
    ? dashboard.scheduled_campaigns
    : [];

  if (loading || !role) {
    return (
      <div className="role-dashboard-page">
        <div className="role-dashboard-loading">
          <div className="role-dashboard-spinner" />
          <p>Loading your SmartNotify workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="role-dashboard-page">
        <div className="role-dashboard-error">
          <AlertTriangle size={22} />
          <div>
            <strong>Dashboard unavailable</strong>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="role-dashboard-page">
      <div className="role-dashboard-container">

        <section className="role-dashboard-hero">
          <div>
            <span className="role-dashboard-eyebrow">
              {meta.workspace}
            </span>

            <h1>
              Welcome back,{" "}
              {currentUser?.name ||
                currentUser?.email?.split("@")[0] ||
                "User"}
            </h1>

            <p>{meta.description}</p>
          </div>

          <div className="role-badge">
            <UserCog size={17} />
            {meta.label}
          </div>
        </section>

        <section className="role-stat-grid">
          {roleCards.map((card) => (
            <StatCard
              key={card.label}
              {...card}
            />
          ))}
        </section>

        <section className="role-dashboard-visuals">
          {role === ROLES.ADMIN && (
            <>
              <VisualCard className="role-chart-large">
                <PanelHeader eyebrow="PLATFORM OVERVIEW" title="Campaign status distribution" />
                {campaignStatusData.length ? (
                  <div className="role-chart-split">
                    <div className="role-donut-wrap">
                      <ResponsiveContainer width="100%" height={235}>
                        <PieChart>
                          <Pie data={campaignStatusData} dataKey="value" nameKey="name" innerRadius={66} outerRadius={94} paddingAngle={3} stroke="none">
                            {campaignStatusData.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="role-donut-center"><strong>{number(dashboard?.campaigns)}</strong><span>campaigns</span></div>
                    </div>
                    <div className="role-status-legend">
                      {campaignStatusData.map((item, index) => (
                        <div key={item.name}><span><i style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />{item.name}</span><strong>{item.value}</strong></div>
                      ))}
                    </div>
                  </div>
                ) : <div className="role-chart-empty"><Megaphone size={26} /><strong>No campaign activity yet</strong><span>Campaign status will appear here when campaigns exist.</span></div>}
              </VisualCard>

              <VisualCard>
                <PanelHeader eyebrow="CHANNEL MIX" title="Delivery channels" />
                {channelData.length ? (
                  <div className="role-channel-chart">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={channelData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={84} paddingAngle={3} stroke="none">
                          {channelData.map((entry, index) => <Cell key={entry.channel} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <ChannelLegend data={Object.fromEntries(channelData.map((item) => [item.channel, item.value]))} />
                  </div>
                ) : <div className="role-chart-empty"><RadioTower size={26} /><strong>No channel activity yet</strong><span>Channel metrics will appear as messages move through the platform.</span></div>}
              </VisualCard>

              <VisualCard>
                <PanelHeader eyebrow="SYSTEM ACTIVITY" title="Operational snapshot" />
                <div className="role-activity-list">
                  <div className="role-activity-item"><span className="role-activity-dot blue"><Users size={15} /></span><div><strong>{number(dashboard?.users)} users</strong><span>registered across the workspace</span></div></div>
                  <div className="role-activity-item"><span className="role-activity-dot green"><Target size={15} /></span><div><strong>{number(dashboard?.audience)} audiences</strong><span>available target groups</span></div></div>
                  <div className="role-activity-item"><span className="role-activity-dot purple"><FileText size={15} /></span><div><strong>{number(dashboard?.templates)} templates</strong><span>available for reusable content</span></div></div>
                  <div className="role-activity-item"><span className="role-activity-dot orange"><Clock3 size={15} /></span><div><strong>{number(scheduledCampaigns.length)} scheduled</strong><span>campaigns awaiting execution</span></div></div>
                </div>
                <button className="role-link-button" type="button" onClick={() => navigate("/analytics")}>View platform analytics <span>→</span></button>
              </VisualCard>
            </>
          )}

          {role === ROLES.CAMPAIGN_MANAGER && (
            <>
              <VisualCard>
                <PanelHeader eyebrow="CAMPAIGN PIPELINE" title="Campaign status" />
                {campaignStatusData.length ? (
                  <div className="role-chart-split role-chart-split-compact">
                    <div className="role-donut-wrap">
                      <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={campaignStatusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={88} paddingAngle={3} stroke="none">{campaignStatusData.map((entry,index)=><Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
                      <div className="role-donut-center"><strong>{number(dashboard?.campaigns)}</strong><span>total</span></div>
                    </div>
                    <div className="role-status-legend">{campaignStatusData.map((item,index)=><div key={item.name}><span><i style={{background:CHART_COLORS[index % CHART_COLORS.length]}} />{item.name}</span><strong>{item.value}</strong></div>)}</div>
                  </div>
                ) : <div className="role-chart-empty"><Megaphone size={26}/><strong>No campaigns available</strong><span>Your campaign pipeline will appear here.</span></div>}
              </VisualCard>

              <VisualCard>
                <PanelHeader eyebrow="CHANNEL USAGE" title="Configured campaign channels" />
                {campaignChannelData.length ? <div className="role-horizontal-bars">{campaignChannelData.map((item,index)=>{const max=Math.max(...campaignChannelData.map(x=>x.value),1);return <div className="role-bar-row" key={item.name}><div><span>{item.name}</span><strong>{item.value}</strong></div><div className="role-bar-track"><i style={{width:`${Math.max(8,(item.value/max)*100)}%`,background:CHART_COLORS[index % CHART_COLORS.length]}} /></div></div>})}</div> : <div className="role-chart-empty"><RadioTower size={26}/><strong>No configured channel usage</strong><span>Channel mix will appear after campaigns are configured.</span></div>}
              </VisualCard>

              <VisualCard className="role-table-card">
                <PanelHeader eyebrow="RECENT SCHEDULES" title="Upcoming campaigns" action="View campaigns" onAction={() => navigate("/campaign")} />
                {scheduledCampaigns.length ? <div className="role-mini-table"><div className="role-mini-row role-mini-head"><span>Campaign</span><span>Status</span><span>Next run</span></div>{scheduledCampaigns.slice(0,5).map((item)=><div className="role-mini-row" key={item.id}><strong>{item.name || "Untitled campaign"}</strong><span className="role-status-pill scheduled">{item.status || "Scheduled"}</span><time>{item.next_run_at || item.schedule_time ? new Date(item.next_run_at || item.schedule_time).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}) : "Not scheduled"}</time></div>)}</div> : <div className="role-chart-empty"><Clock3 size={26}/><strong>No scheduled campaigns</strong><span>Scheduled campaign activity will appear here.</span></div>}
              </VisualCard>
            </>
          )}

          {role === ROLES.COMMUNICATION_TEAM && (
            <>
              <VisualCard>
                <PanelHeader eyebrow="DELIVERY PERFORMANCE" title="Message delivery funnel" />
                {deliveryStatusData.length ? <ResponsiveContainer width="100%" height={260}><BarChart data={deliveryStatusData} margin={{top:10,right:12,left:-16,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eef6"/><XAxis dataKey="name" tick={{fontSize:12,fill:"#64748b"}} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="value" radius={[7,7,0,0]} fill="#2563eb" /></BarChart></ResponsiveContainer> : <div className="role-chart-empty"><Send size={26}/><strong>No delivery records yet</strong><span>Delivery performance will populate automatically.</span></div>}
              </VisualCard>

              <VisualCard>
                <PanelHeader eyebrow="CHANNEL PERFORMANCE" title="Where messages are flowing" />
                {channelData.length ? <div className="role-horizontal-bars">{channelData.map((item,index)=>{const max=Math.max(...channelData.map(x=>x.value),1);return <div className="role-bar-row" key={item.channel}><div><span>{item.name}</span><strong>{item.value}</strong></div><div className="role-bar-track"><i style={{width:`${Math.max(8,(item.value/max)*100)}%`,background:CHART_COLORS[index % CHART_COLORS.length]}} /></div></div>})}</div> : <div className="role-chart-empty"><RadioTower size={26}/><strong>No channel data available</strong><span>Tested and active channels will appear here.</span></div>}
                <button className="role-link-button" type="button" onClick={() => navigate("/channels")}>Open channel console <span>→</span></button>
              </VisualCard>

              <VisualCard className="role-table-card">
                <PanelHeader eyebrow="OPERATIONS" title="Upcoming communication runs" action="Delivery tracking" onAction={() => navigate("/delivery-tracking")} />
                {scheduledCampaigns.length ? <div className="role-mini-table"><div className="role-mini-row role-mini-head"><span>Campaign</span><span>Channels</span><span>Next run</span></div>{scheduledCampaigns.slice(0,5).map(item=><div className="role-mini-row" key={item.id}><strong>{item.name || "Untitled campaign"}</strong><span>{(item.channels || []).map(c=>CHANNEL_LABELS[c]||c).join(", ") || "—"}</span><time>{item.next_run_at || item.schedule_time ? new Date(item.next_run_at || item.schedule_time).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}) : "Not scheduled"}</time></div>)}</div> : <div className="role-chart-empty"><Clock3 size={26}/><strong>No scheduled runs</strong><span>Upcoming communication jobs will appear here.</span></div>}
              </VisualCard>
            </>
          )}
        </section>

        {role === ROLES.ADMIN && (
          <>
            <section className="role-panel-grid">
              <div className="role-panel">
                <div className="role-panel-heading">
                  <div>
                    <span>PLATFORM OVERVIEW</span>
                    <h2>Campaign lifecycle</h2>
                  </div>
                  <Megaphone size={20} />
                </div>

                <div className="role-progress-list">
                  {[
                    ["Draft", status.draft, "blue"],
                    [
                      "Pending Review",
                      status.pending_review,
                      "purple",
                    ],
                    [
                      "Approved",
                      status.approved,
                      "green",
                    ],
                    [
                      "Scheduled",
                      status.scheduled,
                      "orange",
                    ],
                    [
                      "Sending",
                      status.sending,
                      "blue",
                    ],
                    [
                      "Completed",
                      status.completed,
                      "green",
                    ],
                    [
                      "Rejected",
                      status.rejected,
                      "red",
                    ],
                  ].map(([label, value, tone]) => (
                    <div
                      className="role-progress-row"
                      key={label}
                    >
                      <div>
                        <span>{label}</span>
                        <strong>
                          {number(value)}
                        </strong>
                      </div>
                      <div className="role-progress-track">
                        <div
                          className={`role-progress-fill ${tone}`}
                          style={{
                            width: `${Math.min(
                              100,
                              Number(value || 0) /
                                Math.max(
                                  1,
                                  Number(
                                    dashboard?.campaigns ||
                                      0
                                  )
                                ) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="role-panel">
                <div className="role-panel-heading">
                  <div>
                    <span>SYSTEM OVERSIGHT</span>
                    <h2>Administration</h2>
                  </div>
                  <Settings size={20} />
                </div>

                <div className="role-action-list">
                  <ActionCard
                    icon={UserCog}
                    title="Manage team users"
                    description="Create users and assign workspace roles."
                    action="Open user management"
                    onClick={() =>
                      navigate("/users")
                    }
                  />
                  <ActionCard
                    icon={BarChart3}
                    title="Platform analytics"
                    description="Review delivery and engagement performance."
                    action="Open analytics"
                    onClick={() =>
                      navigate("/analytics")
                    }
                  />
                </div>
              </div>
            </section>
          </>
        )}

        {role === ROLES.CAMPAIGN_MANAGER && (
          <>
            <section className="role-panel-grid">
              <div className="role-panel">
                <div className="role-panel-heading">
                  <div>
                    <span>CAMPAIGN WORKFLOW</span>
                    <h2>Plan → create → schedule</h2>
                  </div>
                  <Sparkles size={20} />
                </div>

                <div className="role-workflow">
                  {[
                    {
                      title: "Select audience",
                      description:
                        "Build or refine the target segment.",
                      icon: Target,
                      path: "/audience",
                    },
                    {
                      title: "Create campaign",
                      description:
                        "Draft the message and choose the channels.",
                      icon: Megaphone,
                      path: "/campaign",
                    },
                    {
                      title: "Use AI Studio",
                      description:
                        "Generate, personalize or translate content.",
                      icon: Sparkles,
                      path: "/ai-studio",
                    },
                    {
                      title: "Schedule",
                      description:
                        "Set the campaign execution time.",
                      icon: Clock3,
                      path: "/campaign",
                    },
                  ].map((item) => (
                    <ActionCard
                      key={item.title}
                      icon={item.icon}
                      title={item.title}
                      description={item.description}
                      action="Open"
                      onClick={() =>
                        navigate(item.path)
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="role-panel">
                <div className="role-panel-heading">
                  <div>
                    <span>CAMPAIGN STATUS</span>
                    <h2>Current pipeline</h2>
                  </div>
                  <Activity size={20} />
                </div>

                <div className="role-status-grid">
                  <div>
                    <span>Draft</span>
                    <strong>
                      {number(status.draft)}
                    </strong>
                  </div>
                  <div>
                    <span>Pending Review</span>
                    <strong>
                      {number(status.pending_review)}
                    </strong>
                  </div>
                  <div>
                    <span>Approved</span>
                    <strong>
                      {number(status.approved)}
                    </strong>
                  </div>
                  <div>
                    <span>Scheduled</span>
                    <strong>
                      {number(status.scheduled)}
                    </strong>
                  </div>
                  <div>
                    <span>Sending</span>
                    <strong>
                      {number(status.sending)}
                    </strong>
                  </div>
                  <div>
                    <span>Completed</span>
                    <strong>
                      {number(status.completed)}
                    </strong>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {role === ROLES.COMMUNICATION_TEAM && (
          <>
            <section className="role-panel-grid">
              <div className="role-panel">
                <div className="role-panel-heading">
                  <div>
                    <span>COMMUNICATION OPERATIONS</span>
                    <h2>Delivery control center</h2>
                  </div>
                  <RadioTower size={20} />
                </div>

                <div className="role-status-grid">
                  <div>
                    <span>Sent</span>
                    <strong>
                      {number(delivery?.sent)}
                    </strong>
                  </div>
                  <div>
                    <span>Delivered</span>
                    <strong>
                      {number(delivery?.delivered)}
                    </strong>
                  </div>
                  <div>
                    <span>Failed</span>
                    <strong>
                      {number(delivery?.failed)}
                    </strong>
                  </div>
                  <div>
                    <span>Opened</span>
                    <strong>
                      {number(delivery?.opened)}
                    </strong>
                  </div>
                  <div>
                    <span>Clicked</span>
                    <strong>
                      {number(delivery?.clicked)}
                    </strong>
                  </div>
                  <div>
                    <span>Engagement</span>
                    <strong>
                      {percentage(
                        delivery?.engagement_rate
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="role-panel">
                <div className="role-panel-heading">
                  <div>
                    <span>OPERATIONS</span>
                    <h2>What needs attention?</h2>
                  </div>
                  <AlertTriangle size={20} />
                </div>

                <div className="role-action-list">
                  <ActionCard
                    icon={Activity}
                    title="Monitor deliveries"
                    description="Inspect delivery status and engagement."
                    action="Open delivery tracking"
                    onClick={() =>
                      navigate("/delivery-tracking")
                    }
                  />
                  <ActionCard
                    icon={RadioTower}
                    title="Operate channels"
                    description="Test and execute configured communication channels."
                    action="Open channels"
                    onClick={() =>
                      navigate("/channels")
                    }
                  />
                  <ActionCard
                    icon={Megaphone}
                    title="Review campaigns"
                    description="Open campaigns prepared for communication execution."
                    action="Open campaigns"
                    onClick={() =>
                      navigate("/campaign")
                    }
                  />
                </div>
              </div>
            </section>
          </>
        )}

        <section className="role-quick-actions">
          <div>
            <span>SMARTNOTIFY WORKSPACE</span>
            <h2>Quick access</h2>
          </div>

          <div className="role-quick-action-grid">
            {role === ROLES.ADMIN && (
              <>
                <ActionCard
                  icon={UserCog}
                  title="Users"
                  description="Manage users and roles."
                  action="Open"
                  onClick={() => navigate("/users")}
                />
                <ActionCard
                  icon={Settings}
                  title="Settings"
                  description="Manage platform settings."
                  action="Open"
                  onClick={() => navigate("/settings")}
                />
              </>
            )}

            {role === ROLES.CAMPAIGN_MANAGER && (
              <>
                <ActionCard
                  icon={Megaphone}
                  title="Campaigns"
                  description="Create and schedule campaigns."
                  action="Open"
                  onClick={() => navigate("/campaign")}
                />
                <ActionCard
                  icon={Sparkles}
                  title="AI Studio"
                  description="Generate and translate campaign content."
                  action="Open"
                  onClick={() => navigate("/ai-studio")}
                />
              </>
            )}

            {role === ROLES.COMMUNICATION_TEAM && (
              <>
                <ActionCard
                  icon={Send}
                  title="Delivery Tracking"
                  description="Monitor and retry failed deliveries."
                  action="Open"
                  onClick={() =>
                    navigate("/delivery-tracking")
                  }
                />
                <ActionCard
                  icon={RadioTower}
                  title="Channels"
                  description="Operate configured communication channels."
                  action="Open"
                  onClick={() => navigate("/channels")}
                />
              </>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}