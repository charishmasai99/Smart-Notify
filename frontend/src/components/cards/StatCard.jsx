export default function StatCard({
  title,
  count,
  growth,
}) {

  return (

    <div className="bg-white rounded-2xl shadow-md p-6">

      <p className="text-gray-500 text-sm">
        {title}
      </p>

      <div className="flex items-center justify-between mt-3">

        <h2 className="text-3xl font-bold">
          {count}
        </h2>

        {growth && (

          <span className="text-green-600 text-sm font-semibold">
            ↑ {growth}
          </span>

        )}

      </div>

    </div>

  );
}