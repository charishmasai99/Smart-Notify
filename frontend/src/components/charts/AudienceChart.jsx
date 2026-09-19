import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AudienceChart({ audience }) {

  const chartData = [
    {
      month: "Jan",
      audience: Math.max(0, audience - 4),
    },
    {
      month: "Feb",
      audience: Math.max(0, audience - 3),
    },
    {
      month: "Mar",
      audience: Math.max(0, audience - 2),
    },
    {
      month: "Apr",
      audience: Math.max(0, audience - 1),
    },
    {
      month: "May",
      audience,
    },
  ];

  return (

    <div className="bg-white rounded-2xl shadow-md p-6">

      <h2 className="text-xl font-semibold mb-6">
        Audience Growth
      </h2>

      <ResponsiveContainer width="100%" height={300}>

        <LineChart data={chartData}>

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="month" />

          <YAxis allowDecimals={false} />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="audience"
            stroke="#2563eb"
            strokeWidth={3}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );
}