import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DeliveryChart() {

  const data = [
    {
      name: "Delivered",
      value: 98,
    },
    {
      name: "Failed",
      value: 2,
    },
  ];

  return (

    <div className="bg-white rounded-2xl shadow-md p-6">

      <h2 className="text-xl font-semibold mb-6">
        Delivery Rate
      </h2>

      <ResponsiveContainer width="100%" height={300}>

        <PieChart>

          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >

            {data.map((entry, index) => (

              <Cell
                key={`cell-${index}`}
                fill={
                  index === 0
                    ? "#2563eb"
                    : "#ef4444"
                }
              />

            ))}

          </Pie>

          <Tooltip />

        </PieChart>

      </ResponsiveContainer>

    </div>

  );
}