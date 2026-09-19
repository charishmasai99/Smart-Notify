import api from "./api";

const feedbackService = {

  // ==========================================================
  // ADMIN / DASHBOARD
  // ==========================================================

  getAll: async () => {
    const response = await api.get(
      "/feedback/"
    );

    return response.data;
  },


  getCampaignFeedback: async (campaignId) => {
    const response = await api.get(
      `/feedback/campaign/${campaignId}`
    );

    return response.data;
  },


  getAnalytics: async (campaignId = "") => {
    const query = campaignId
      ? `?campaign_id=${encodeURIComponent(campaignId)}`
      : "";

    const response = await api.get(
      `/feedback/analytics${query}`
    );

    return response.data;
  },


  // ==========================================================
  // ADMIN CREATE FEEDBACK
  // ==========================================================

  create: async (data) => {
    const response = await api.post(
      "/feedback/",
      data
    );

    return response.data;
  },


  // ==========================================================
  // PUBLIC FEEDBACK RESPONSE
  // ==========================================================

  getResponseDetails: async (token) => {

    if (!token) {
      throw new Error(
        "Feedback token is missing."
      );
    }

    const response = await api.get(
      `/feedback/response/${encodeURIComponent(token)}`
    );

    return response.data;
  },


  // ==========================================================
  // SUBMIT PUBLIC FEEDBACK
  // ==========================================================

  submitResponse: async (
    token,
    data
  ) => {

    if (!token) {
      throw new Error(
        "Feedback token is missing."
      );
    }

    const response = await api.post(
      `/feedback/response/${encodeURIComponent(token)}`,
      data
    );

    return response.data;
  },
// ==========================================================
// VOICE FEEDBACK TRANSLATION
// ==========================================================

translateFeedback: async (
  data
) => {
  const response = await api.post(
    "/feedback/translate",
    {
      content: data.content,
      source_language: data.source_language,
      target_language: data.target_language,
    }
  );

  return response.data;
},

};



export default feedbackService;