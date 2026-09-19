import {
  Users,
  GraduationCap,
  Briefcase,
  Languages,
} from "lucide-react";

function splitValues(value) {
  if (!value) return [];

  return String(value)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export default function AudienceStats({
  audiences = [],
}) {
  const totalAudience = audiences.length;

  const students = audiences.filter((audience) => {
    const values = splitValues(
      audience.audience_type
    );

    return values.some((value) =>
      value.includes("student")
    );
  }).length;

  const professionals = audiences.filter(
    (audience) => {
      const values = splitValues(
        audience.audience_type
      );

      return values.some((value) =>
        value.includes("professional")
      );
    }
  ).length;

  const languageSet = new Set();

  audiences.forEach((audience) => {
    splitValues(audience.language).forEach(
      (language) => {
        languageSet.add(language);
      }
    );
  });

  const cards = [
    {
      title: "Total Audience",
      value: totalAudience,
      icon: Users,
    },
    {
      title: "Students",
      value: students,
      icon: GraduationCap,
    },
    {
      title: "Professionals",
      value: professionals,
      icon: Briefcase,
    },
    {
      title: "Languages",
      value: languageSet.size,
      icon: Languages,
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between">

              <div>
                <p className="text-base font-medium text-slate-500">
                  {card.title}
                </p>

                <p className="mt-3 text-4xl font-bold text-slate-900">
                  {card.value}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <Icon
                  size={22}
                  strokeWidth={2}
                  className="text-blue-600"
                />
              </div>

            </div>
          </div>
        );
      })}

    </div>
  );
}