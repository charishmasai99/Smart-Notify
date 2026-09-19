import api from "./api";

const userService = {

  // =====================================================
  // GET ALL USERS
  // =====================================================

  getAll: async () => {
    const token = localStorage.getItem("token");

    const response = await api.get(
      "/users/",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(
      "GET USERS RESPONSE:",
      response.data
    );

    return response.data;
  },

  // =====================================================
  // GET ONE USER
  // =====================================================

  getById: async (id) => {
    const token = localStorage.getItem("token");

    const response = await api.get(
      `/users/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  },

  // =====================================================
  // CREATE USER
  // =====================================================

  create: async (data) => {
    const token = localStorage.getItem("token");

    console.log(
      "POST /users/",
      data
    );

    const response = await api.post(
      "/users/",
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "CREATE RESPONSE:",
      response.data
    );

    return response.data;
  },

  // =====================================================
  // UPDATE USER
  // =====================================================

  update: async (id, data) => {
    const token = localStorage.getItem("token");

    console.log("==============================");
    console.log("PUT USER");
    console.log(
      "URL:",
      `/users/${id}`
    );
    console.log(
      "DATA:",
      data
    );
    console.log("==============================");

    const response = await api.put(
      `/users/${id}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("==============================");
    console.log(
      "PUT STATUS:",
      response.status
    );
    console.log(
      "PUT RESPONSE:",
      response.data
    );
    console.log("==============================");

    return response.data;
  },

  // =====================================================
  // DELETE USER
  // =====================================================

  delete: async (id) => {
    const token = localStorage.getItem("token");

    console.log(
      "DELETE USER:",
      id
    );

    const response = await api.delete(
      `/users/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(
      "DELETE RESPONSE:",
      response.data
    );

    return response.data;
  },

};

export default userService;