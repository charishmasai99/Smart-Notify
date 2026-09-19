import api from "../config/apiConfig";

const campaignService = {
  getAll: async () => {
    const response = await api.get("/campaign/");
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(
      `/campaign/${id}`
    );

    return response.data;
  },

  create: async (data) => {
    const response = await api.post(
      "/campaign/",
      data
    );

    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(
      `/campaign/${id}`,
      data
    );

    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(
      `/campaign/${id}`
    );

    return response.data;
  },
};

export default campaignService;