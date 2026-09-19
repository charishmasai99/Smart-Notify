import { useMemo } from "react";
import { Bell, Globe2, Mail, MessageCircle, Smartphone } from "lucide-react";

const CHANNELS = [
  { id: "email", label: "Email", icon: Mail, tone: "blue" },
  { id: "sms", label: "SMS", icon: Smartphone, tone: "emerald" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, tone: "green" },
  { id: "push", label: "Push Notification", icon: Bell, tone: "amber" },
  { id: "web_broadcast", label: "Web Broadcast", icon: Globe2, tone: "violet" },
];

const toneClasses = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  green: "border-green-200 bg-green-50 text-green-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
};

export default function MultiChannelSelector({ value = [], onChange, disabled = false }) {
  const selected = useMemo(() => new Set(value), [value]);

  const toggle = (id) => {
    if (disabled) return;
    const next = selected.has(id)
      ? value.filter((item) => item !== id)
      : [...value, id];
    onChange(next);
  };

  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm font-bold text-slate-900">Communication Channels</div>
          <p className="mt-1 text-xs text-slate-500">
            Select one or more channels for this campaign.
          </p>
        </div>
        <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
          {value.length} selected
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {CHANNELS.map(({ id, label, icon: Icon, tone }) => {
          const isSelected = selected.has(id);
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(id)}
              className={`relative flex min-h-[92px] flex-col items-start justify-between rounded-2xl border p-3 text-left transition ${
                isSelected
                  ? `${toneClasses[tone]} ring-2 ring-blue-100`
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/40"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                <Icon size={19} />
              </span>
              <span className="text-xs font-bold leading-4">{label}</span>
              {isSelected && (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
