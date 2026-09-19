import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function CampaignChart({ data }) {

  const chartData = [
    {
      name: "Draft",
      value: data?.draft || 0,
    },
    {
      name: "Pending",
      value: data?.pending_review || 0,
    },
    {
      name: "Approved",
      value: data?.approved || 0,
    },
    {
      name: "Scheduled",
      value: data?.scheduled || 0,
    },
    {
      name: "Sending",
      value: data?.sending || 0,
    },
    {
      name: "Completed",
      value: data?.completed || 0,
    },
    {
      name: "Rejected",
      value: data?.rejected || 0,
    },
  ];

  return (

    <div className="bg-white rounded-2xl shadow-md p-6">

      <h2 className="text-xl font-semibold mb-6">
        Campaign Status
      </h2>

      <ResponsiveContainer width="100%" height={300}>

        <BarChart data={chartData}>

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