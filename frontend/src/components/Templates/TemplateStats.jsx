export default function TemplateStats({
  templates = [],
}) {
  const totalTemplates =
    templates.length;

  const emergencyAlerts =
    templates.filter(
      (template) =>
        template.template_type ===
        "Emergency Alert"
    ).length;

  const healthAwareness =
    templates.filter(
      (template) =>
        template.template_type ===
        "Health Awareness"
    ).length;

  const announcements =
    templates.filter(
      (template) =>
        template.template_type ===
        "Announcement"
    ).length;

  const cards = [
    {
      title: "Total Templates",
      value: totalTemplates,
    },
    {
      title: "Emergency Alerts",
      value: emergencyAlerts,
    },
    {
      title: "Health Awareness",
      value: healthAwareness,
    },
    {
      title: "Announcements",
      value: announcements,
    },
  ];

  return (
    <div
      className="
        grid
        grid-cols-1
        gap-6
        md:grid-cols-2
        lg:grid-cols-4
        mb-8
      "
    >
      {cards.map((card) => (
        <div
          key={card.title}
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-sm
          "
        >
          <p
            className="
              text-sm
              font-semibold
              text-slate-500
            "
          >
            {card.title}
          </p>

          <p
            className="
              mt-3
              text-4xl
              font-bold
              text-slate-900
            "
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}