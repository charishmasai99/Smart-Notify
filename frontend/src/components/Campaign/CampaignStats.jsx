export default function CampaignStats({ campaigns }) {
  const totalCampaigns = campaigns.length;

  const activeCampaigns = campaigns.filter(
    (campaign) => campaign.status === "Active"
  ).length;

  const completedCampaigns = campaigns.filter(
    (campaign) => campaign.status === "Completed"
  ).length;

  const languages = new Set(
    campaigns
      .filter((campaign) => campaign.language)
      .map((campaign) => campaign.language)
  ).size;

  const cards = [
    {
      title: "Total Campaigns",
      value: totalCampaigns,
      color: "bg-blue-600",
    },
    {
      title: "Active Campaigns",
      value: activeCampaigns,
      color: "bg-green-600",
    },
    {
      title: "Completed Campaigns",
      value: completedCampaigns,
      color: "bg-purple-600",
    },
    {
      title: "Languages",
      value: languages,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`${card.color} text-white rounded-xl shadow-lg p-6`}
        >
          <h3 className="text-lg">{card.title}</h3>

          <p className="text-4xl font-bold mt-4">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}