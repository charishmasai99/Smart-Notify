import api from "./api";


const aiService = {

  // =====================================================
  // GENERATE CONTENT
  // =====================================================

  generateContent: async (data) => {
    const response = await api.post(
      "/ai/generate-content",
      {
        brief:
          data.brief,

        campaign_type:
          data.campaign_type ||
          "announcement",

        audience:
          data.audience ||
          "general public",

        tone:
          data.tone ||
          "professional",
      }
    );

    return response.data;
  },


  // =====================================================
  // PERSONALIZE
  // =====================================================

  personalize: async (data) => {
    const response = await api.post(
      "/ai/personalize",
      {
        content:
          data.content,

        audience:
          data.audience ||
          "general public",

        tone:
          data.tone ||
          "professional",

        personalization_fields:
          data.personalization_fields ||
          [
            "first_name",
            "city",
          ],
      }
    );

    return response.data;
  },


  // =====================================================
  // TONE CHECK
  // =====================================================

  toneCheck: async (data) => {
    const response = await api.post(
      "/ai/tone-check",
      {
        content:
          data.content,
      }
    );

    return response.data;
  },


  // =====================================================
  // TRANSLATE
  // =====================================================

  translate: async (data) => {
    const response = await api.post(
      "/ai/translate",
      {
        content:
          data.content,

        target_language:
          data.target_language,
      }
    );

    return response.data;
  },


  // =====================================================
  // COMPLIANCE CHECK
  // =====================================================

  complianceCheck: async (data) => {
    const response = await api.post(
      "/ai/compliance-check",
      {
        content:
          data.content,
      }
    );

    return response.data;
  },


  // =====================================================
  // COMMUNICATION SIMULATION
  //
  // Kept in the service because the backend supports it.
  // It is NOT displayed inside AI Studio.
  // =====================================================

  sendSimulation: async (data) => {
    const response = await api.post(
      "/ai/send-simulation",
      {
        channel:
          data.channel,

        recipient:
          data.recipient,

        content:
          data.content,

        subject:
          data.subject || "",
      }
    );

    return response.data;
  },


  // =====================================================
  // REAL EMAIL
  //
  // Used from Campaigns / Delivery flow,
  // NOT AI Studio.
  // =====================================================

  sendEmail: async (data) => {
    const response = await api.post(
      "/ai/send-email",
      {
        campaign_id:
          data.campaign_id,

        recipient:
          data.recipient,

        subject:
          data.subject,

        content:
          data.content,
      }
    );

    return response.data;
  },


  // =====================================================
  // REAL SMS
  // =====================================================

  sendSMS: async (data) => {
    const response = await api.post(
      "/ai/send-sms",
      {
        campaign_id:
          data.campaign_id,

        recipient:
          data.recipient,

        content:
          data.content,
      }
    );

    return response.data;
  },


  // =====================================================
  // REAL WHATSAPP
  // =====================================================

  sendWhatsApp: async (data) => {
    const response = await api.post(
      "/ai/send-whatsapp",
      {
        campaign_id:
          data.campaign_id,

        recipient:
          data.recipient,

        content:
          data.content,
      }
    );

    return response.data;
  },

};


export default aiService;