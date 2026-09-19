import api from "./api";

const deliveryService = {

  // =========================================================
  // CAMPAIGNS WITH DELIVERY RECORDS
  // =========================================================

  getCampaigns: async () => {
    const response = await api.get(
      "/delivery/campaigns"
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
  // DELIVERY SUMMARY
  // =========================================================

  getSummary: async (
    query = ""
  ) => {

    const response =
      await api.get(
        `/delivery/summary${query}`
      );

    return response.data;
  },


  // =========================================================
  // MARK DELIVERY READ
  // =========================================================

  markDeliveryRead: async (
    deliveryId
  ) => {

    const response =
      await api.post(
        `/delivery/${deliveryId}/read`
      );

    return response.data;
  },


  // =========================================================
  // RECORD DELIVERY CLICK
  // =========================================================

  markDeliveryClicked: async (
    deliveryId
  ) => {

    const response =
      await api.post(
        `/delivery/${deliveryId}/click`
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
  // ANALYTICS
  // =========================================================

  getAnalytics: async (
    query = ""
  ) => {

    const response =
      await api.get(
        `/delivery/analytics${query}`
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

export default deliveryService;