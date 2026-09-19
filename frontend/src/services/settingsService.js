import api from "./api";

const settingsService = {

  getProfile: async () => {

    const response =
      await api.get("/users/me");

    return response.data;
  },

};

export default settingsService;