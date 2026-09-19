import api from "./api";

const channelService = {
  getChannels: async () => {
    const response = await api.get("/channels/");
    return response.data;
  },

  testChannel: async (data) => {
    const response = await api.post("/channels/test", data);
    return response.data;
  },

  broadcast: async (data) => {
    const response = await api.post("/channels/web-broadcast", data);
    return response.data;
  },

  sendMultiChannel: async (data) => {
    const response = await api.post("/channels/send", data);
    return response.data;
  },
};

export default channelService;
