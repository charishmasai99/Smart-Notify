import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function CampaignStatusBar({ status }) {

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

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">

      <h2 className="text-xl font-bold mb-6">
        Campaign Status
      </h2>

      <ResponsiveContainer width="100%" height={350}>

        <BarChart data={data}>

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="name" />

          <YAxis allowDecimals={false} />

          <Tooltip />

          <Bar
            dataKey="value"
            fill="#2563eb"
            radius={[6, 6, 0, 0]}
          />

        </BarChart>

      </ResponsiveContainer>

    </div>
  );
}