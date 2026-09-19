import api from "./api";


const dashboardService = {

  // =========================================================
  // DASHBOARD
  // =========================================================

  getDashboard: async () => {

    const response =
      await api.get(
        "/dashboard/"
      );

    return response.data;

  },


  // =========================================================
  // STATS
  // =========================================================

  getStats: async () => {

    const response =
      await api.get(
        "/dashboard/"
      );

    return response.data;

  },


  // =========================================================
  // DELIVERY ANALYTICS
  // =========================================================

  getDeliveryAnalytics: async () => {

    const response =
      await api.get(
        "/delivery/analytics"
      );

    console.log(
      "DELIVERY ANALYTICS:",
      response.data
    );

    return response.data;

  },


  // =========================================================
  // CAMPAIGN DELIVERIES
  // =========================================================

  getCampaignDeliveries: async (
    campaignId
  ) => {

    const response =
      await api.get(
        `/delivery/campaign/${campaignId}`
      );

    return response.data;

  },


  // =========================================================
  // SINGLE DELIVERY
  // =========================================================

  getDelivery: async (
    deliveryId
  ) => {

    const response =
      await api.get(
        `/delivery/${deliveryId}`
      );

    return response.data;

  },


  // =========================================================
  // FAILED DELIVERIES
  // =========================================================

  getFailedDeliveries: async () => {

    const response =
      await api.get(
        "/delivery/failed"
      );

    return response.data;

  },


  // =========================================================
  // RETRY
  // =========================================================

  retryDelivery: async (
    deliveryId
  ) => {

    const response =
      await api.post(
        `/delivery/${deliveryId}/retry`
      );

    return response.data;

  },

};


export default dashboardService;