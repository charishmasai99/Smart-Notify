

import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Globe2,
  HeartHandshake,
  Megaphone,
  MessageSquareText,
  RadioTower,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";


/* ============================================================
   SMARTNOTIFY
   ABOUT PAGE
   ============================================================

   This page is intentionally self-contained.

   It uses the same visual language as the existing SmartNotify
   dashboard:
   - dark navy navigation-compatible surfaces
   - blue primary actions
   - rounded cards
   - soft borders and shadows
   - Lucide icons
   - responsive Tailwind classes

   No backend calls are required for this page because the
   content describes the platform itself.
   ============================================================ */


const platformFeatures = [
  {
    icon: Megaphone,
    title: "Campaign Management",
    description:
      "Plan, create and manage public-awareness campaigns from a single workspace.",
    badge: "Campaigns",
  },
  {
    icon: Sparkles,
    title: "AI Campaign Studio",
    description:
      "Create clearer, audience-friendly communication content with AI assistance.",
    badge: "AI assisted",
  },
  {
    icon: Users,
    title: "Audience Management",
    description:
      "Organize target groups and connect campaigns with the audiences that need them.",
    badge: "Targeting",
  },
  {
    icon: RadioTower,
    title: "Multi-Channel Communication",
    description:
      "Coordinate Email, SMS, WhatsApp, Push Notification and Web Broadcast delivery.",
    badge: "5 channels",
  },
  {
    icon: Activity,
    title: "Delivery Tracking",
    description:
      "Monitor delivery states, failures, retries and engagement signals in one place.",
    badge: "Real time",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description:
      "Turn communication activity into useful performance, delivery and engagement insights.",
    badge: "Insights",
  },
];


const communicationChannels = [
  {
    icon: Send,
    name: "Email",
    description: "Detailed announcements and campaign communication.",
  },
  {
    icon: MessageSquareText,
    name: "SMS",
    description: "Fast, concise alerts for time-sensitive communication.",
  },
  {
    icon: MessageSquareText,
    name: "WhatsApp",
    description: "Accessible conversational outreach for communities.",
  },
  {
    icon: Bell,
    name: "Push Notification",
    description: "Immediate alerts for connected users and devices.",
  },
  {
    icon: Globe2,
    name: "Web Broadcast",
    description: "Instant browser-based public communication.",
  },
];


const workflowSteps = [
  {
    number: "01",
    icon: Target,
    title: "Define the audience",
    description:
      "Select or organize the audience that should receive the communication.",
  },
  {
    number: "02",
    icon: FileText,
    title: "Create the message",
    description:
      "Use templates, campaign content or AI assistance to prepare the message.",
  },
  {
    number: "03",
    icon: Clock3,
    title: "Schedule or send",
    description:
      "Choose the appropriate channel and deliver immediately or according to schedule.",
  },
  {
    number: "04",
    icon: BarChart3,
    title: "Measure the outcome",
    description:
      "Review delivery, engagement, feedback and campaign performance.",
  },
];


const principles = [
  {
    icon: Zap,
    title: "Timely",
    description:
      "Important information should reach people when it matters most.",
  },
  {
    icon: ShieldCheck,
    title: "Responsible",
    description:
      "Communication workflows should provide clear control over audiences, channels and delivery.",
  },
  {
    icon: HeartHandshake,
    title: "Community-focused",
    description:
      "SmartNotify is designed around understandable, actionable and useful public communication.",
  },
];


const stats = [
  {
    value: "5",
    label: "Communication channels",
  },
  {
    value: "AI",
    label: "Content assistance",
  },
  {
    value: "24/7",
    label: "Operational visibility",
  },
  {
    value: "1",
    label: "Unified workspace",
  },
];


export default function About() {
  return (
    <div className="min-h-full bg-slate-50 text-slate-900">

      {/* ========================================================
          PAGE HEADER / HERO
          ======================================================== */}

      <section className="relative overflow-hidden border-b border-slate-200 bg-white">

        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-indigo-100/50 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">

          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">

            {/* Hero copy */}
            <div>

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                <Sparkles size={14} />
                Public Awareness Platform
              </div>

              <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Communication that
                <span className="block text-blue-600">
                  reaches people when it matters.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                SmartNotify is a unified communication platform for planning,
                creating, delivering and measuring public-awareness messages
                across multiple channels.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">

                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                  <CheckCircle2 size={17} className="text-emerald-500" />
                  Campaign management
                </div>

                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                  <CheckCircle2 size={17} className="text-emerald-500" />
                  Multi-channel delivery
                </div>

                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                  <CheckCircle2 size={17} className="text-emerald-500" />
                  Analytics & feedback
                </div>

              </div>

            </div>


            {/* Hero visual */}
            <div className="relative">

              <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-3 shadow-2xl shadow-slate-300/40">

                <div className="overflow-hidden rounded-[1.45rem] border border-white/10 bg-slate-900">

                  {/* Mini application header */}
                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-xs font-extrabold text-white">
                        SN
                      </div>

                      <div>
                        <p className="text-sm font-bold text-white">
                          SmartNotify
                        </p>

                        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                          Communication Platform
                        </p>
                      </div>

                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="text-[11px] font-medium text-slate-400">
                        Platform active
                      </span>
                    </div>

                  </div>


                  {/* Mini dashboard body */}
                  <div className="grid gap-4 p-5">

                    <div className="grid grid-cols-3 gap-3">

                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <Users size={17} className="text-blue-400" />
                        <p className="mt-3 text-2xl font-bold text-white">
                          Audience
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Target groups
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <Megaphone size={17} className="text-violet-400" />
                        <p className="mt-3 text-2xl font-bold text-white">
                          Campaign
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Communication
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <BarChart3 size={17} className="text-emerald-400" />
                        <p className="mt-3 text-2xl font-bold text-white">
                          Insights
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Performance
                        </p>
                      </div>

                    </div>


                    <div className="rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-600/25 to-indigo-600/10 p-5">

                      <div className="flex items-center justify-between">

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                            Communication flow
                          </p>

                          <p className="mt-1 text-lg font-bold text-white">
                            Create → Deliver → Measure
                          </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20">
                          <Rocket size={21} className="text-blue-300" />
                        </div>

                      </div>

                      <div className="mt-5 flex items-center gap-2">

                        <div className="h-2 flex-1 rounded-full bg-blue-500" />
                        <div className="h-2 flex-1 rounded-full bg-blue-500" />
                        <div className="h-2 flex-1 rounded-full bg-emerald-400" />

                      </div>

                      <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-500">
                        <span>Campaign</span>
                        <span>Delivery</span>
                        <span>Insights</span>
                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>
        </div>
      </section>


      {/* ========================================================
          PLATFORM STATS
          ======================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:grid-cols-2 lg:grid-cols-4">

          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`
                px-6 py-6
                ${index !== 0 ? "border-t border-slate-200 sm:border-l sm:border-t-0" : ""}
                ${index === 2 ? "lg:border-l" : ""}
              `}
            >
              <p className="text-3xl font-extrabold tracking-tight text-slate-950">
                {stat.value}
              </p>

              <p className="mt-1 text-sm font-medium text-slate-500">
                {stat.label}
              </p>
            </div>
          ))}

        </div>
      </section>


      {/* ========================================================
          ABOUT / MISSION
          ======================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-12">

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">

          <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-xl">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
              <HeartHandshake size={24} />
            </div>

            <p className="mt-7 text-sm font-bold uppercase tracking-[0.16em] text-blue-300">
              Our mission
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
              Make public communication clearer, faster and more useful.
            </h2>

            <p className="mt-5 text-sm leading-7 text-slate-300">
              SmartNotify brings communication planning, audience management,
              content creation, delivery operations and performance insights
              together so teams can focus on reaching the right people with
              meaningful information.
            </p>

          </div>


          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ShieldCheck size={22} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                  Built around responsible communication
                </p>

                <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
                  One workspace. Complete visibility.
                </h2>
              </div>

            </div>

            <p className="mt-5 text-sm leading-7 text-slate-600">
              From the first campaign draft to delivery and audience response,
              SmartNotify provides connected workflows instead of isolated
              communication tools.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">

              {principles.map((principle) => {
                const Icon = principle.icon;

                return (
                  <div
                    key={principle.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                      <Icon size={19} />
                    </div>

                    <h3 className="mt-4 font-bold text-slate-900">
                      {principle.title}
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {principle.description}
                    </p>
                  </div>
                );
              })}

            </div>

          </div>

        </div>

      </section>


      {/* ========================================================
          PLATFORM CAPABILITIES
          ======================================================== */}

      <section className="bg-white">

        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">

          <div className="max-w-2xl">

            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
              <Zap size={13} />
              Platform capabilities
            </div>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Everything your communication team needs.
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
              SmartNotify connects the major stages of public-awareness
              communication into a single operational workflow.
            </p>

          </div>


          <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {platformFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="
                    group rounded-2xl
                    border border-slate-200
                    bg-slate-50/70
                    p-6
                    transition
                    hover:-translate-y-1
                    hover:border-blue-200
                    hover:bg-white
                    hover:shadow-xl
                  "
                >

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-100 transition group-hover:bg-blue-600 group-hover:text-white">
                      <Icon size={22} />
                    </div>

                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                      {feature.badge}
                    </span>

                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-950">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {feature.description}
                  </p>

                  <div className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-blue-600">
                    Explore capability
                    <ChevronRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>

                </div>
              );
            })}

          </div>

        </div>
      </section>


      {/* ========================================================
          CHANNELS
          ======================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">

        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">

          <div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <RadioTower size={24} />
            </div>

            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950">
              Communicate across the channels your audience already uses.
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              SmartNotify brings multiple communication channels under one
              campaign workflow, making it easier to coordinate outreach and
              understand the resulting delivery and engagement.
            </p>

          </div>


          <div className="grid gap-4 sm:grid-cols-2">

            {communicationChannels.map((channel) => {
              const Icon = channel.icon;

              return (
                <div
                  key={channel.name}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-blue-600">
                    <Icon size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      {channel.name}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {channel.description}
                    </p>
                  </div>

                </div>
              );
            })}

          </div>

        </div>

      </section>


      {/* ========================================================
          WORKFLOW
          ======================================================== */}

      <section className="border-y border-slate-200 bg-slate-100/70">

        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">

          <div className="text-center">

            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-sm ring-1 ring-slate-200">
              <Activity size={14} />
              SmartNotify workflow
            </div>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              From idea to measurable impact.
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              A connected workflow helps teams move from audience selection to
              delivery and feedback without losing operational visibility.
            </p>

          </div>


          <div className="relative mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

            {/* Connector line on larger screens */}
            <div className="pointer-events-none absolute left-[12%] right-[12%] top-12 hidden h-px bg-slate-300 xl:block" />

            {workflowSteps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >

                  <div className="relative z-10 flex items-center justify-between">

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                      <Icon size={21} />
                    </div>

                    <span className="text-xs font-extrabold tracking-widest text-slate-300">
                      {step.number}
                    </span>

                  </div>

                  <h3 className="mt-6 font-bold text-slate-950">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {step.description}
                  </p>

                </div>
              );
            })}

          </div>

        </div>
      </section>


      {/* ========================================================
          OBSERVABILITY / TRUST
          ======================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">

        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-8 text-white shadow-2xl shadow-blue-200 lg:p-10">

          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">

            <div>

              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-100 ring-1 ring-white/10">
                <Activity size={13} />
                Operational visibility
              </div>

              <h2 className="mt-5 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
                Know what was sent, what was delivered and how people responded.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100">
                Delivery tracking, analytics and audience feedback give teams
                a clearer picture of communication performance after a
                campaign is launched.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">

                <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold ring-1 ring-white/10">
                  <CheckCircle2 size={15} />
                  Delivery status
                </span>

                <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold ring-1 ring-white/10">
                  <BarChart3 size={15} />
                  Performance analytics
                </span>

                <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold ring-1 ring-white/10">
                  <MessageSquareText size={15} />
                  Audience feedback
                </span>

              </div>

            </div>


            <div className="grid min-w-[280px] gap-3 sm:grid-cols-3 lg:grid-cols-1">

              <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur">
                <p className="text-xs font-semibold text-blue-100">
                  Delivery
                </p>
                <p className="mt-1 text-xl font-extrabold">
                  Track
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur">
                <p className="text-xs font-semibold text-blue-100">
                  Engagement
                </p>
                <p className="mt-1 text-xl font-extrabold">
                  Understand
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur">
                <p className="text-xs font-semibold text-blue-100">
                  Insights
                </p>
                <p className="mt-1 text-xl font-extrabold">
                  Improve
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ========================================================
          FINAL CTA
          ======================================================== */}

      <section className="mx-auto max-w-7xl px-6 pb-14 lg:px-8 lg:pb-20">

        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm lg:p-12">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Sparkles size={25} />
          </div>

          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950">
            Smart communication starts with a connected workflow.
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Plan the message, reach the audience, monitor delivery and learn
            from the response — all from SmartNotify.
          </p>

          <div className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200">
            Explore SmartNotify
            <ArrowRight size={17} />
          </div>

        </div>

      </section>


      {/* ========================================================
          FOOTER
          ======================================================== */}

      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-7 sm:flex-row sm:items-center sm:justify-between lg:px-8">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-[10px] font-extrabold text-white">
              SN
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                SmartNotify
              </p>

              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Public Awareness Platform
              </p>
            </div>

          </div>

          <p className="text-xs text-slate-400">
            Unified communication, delivery and engagement visibility.
          </p>

        </div>

      </footer>

    </div>
  );
}
