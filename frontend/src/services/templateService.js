import api from "../config/apiConfig";

const templateService = {
  // ==========================================================
  // GET ALL
  // ==========================================================

  getAll: async () => {
    const response = await api.get("/template/");
    return response.data;
  },

  // ==========================================================
  // GET BY ID
  // ==========================================================

  getById: async (id) => {
    const response = await api.get(
      `/template/${id}`
    );

    return response.data;
  },

  // ==========================================================
  // CREATE
  // ==========================================================

  create: async (data) => {
    console.log(
      "TEMPLATE CREATE PAYLOAD:",
      data
    );

    try {
      const response = await api.post(
        "/template/",
        data
      );

      return response.data;

    } catch (error) {
      console.error(
        "TEMPLATE CREATE ERROR:",
        error.response?.data || error.message
      );

      throw error;
    }
  },

  // ==========================================================
  // UPDATE
  // ==========================================================

  update: async (id, data) => {
    console.log(
      "TEMPLATE UPDATE PAYLOAD:",
      data
    );

    try {
      const response = await api.put(
        `/template/${id}`,
        data
      );

      return response.data;

    } catch (error) {
      console.error(
        "TEMPLATE UPDATE ERROR:",
        error.response?.data || error.message
      );

      throw error;
    }
  },

  // ==========================================================
  // DELETE
  // ==========================================================

  delete: async (id) => {
    const response = await api.delete(
      `/template/${id}`
    );

    return response.data;
  },
};

export default templateService;