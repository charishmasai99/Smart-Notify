import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function CampaignStatusPie({ status }) {

  const data = [
    {
      name: "Draft",
      value: status?.draft || 0,
    },
    {
      name: "Pending Review",
      value: status?.pending_review || 0,
    },
    {
      name: "Approved",
      value: status?.approved || 0,
    },
    {
      name: "Scheduled",
      value: status?.scheduled || 0,
    },
    {
      name: "Sending",
      value: status?.sending || 0,
    },
    {
      name: "Completed",
      value: status?.completed || 0,
    },
    {
      name: "Rejected",
      value: status?.rejected || 0,
    },
  ];

  const filteredData = data.filter(
    (item) => item.value > 0
  );

  const COLORS = [
    "#2563eb",
    "#f59e0b",
    "#10b981",
    "#8b5cf6",
    "#06b6d4",
    "#22c55e",
    "#ef4444",
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">

      <h2 className="text-xl font-bold mb-6">
        Campaign Distribution
      </h2>

      <ResponsiveContainer width="100%" height={350}>

        <PieChart>

          <Pie
            data={filteredData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={110}
            label
          >

            {filteredData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}

          </Pie>

          <Tooltip />

          <Legend />

        </PieChart>

      </ResponsiveContainer>

    </div>
  );
}