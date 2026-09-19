import api from "../config/apiConfig"; 
 
const audienceService = { 
  // ===================================================== 
  // GET ALL 
  // ===================================================== 
 
  getAll: async () => { 
    const response = await api.get("/audience/"); 
 
    return response.data; 
  }, 
 
  // ===================================================== 
  // GET BY ID 
  // ===================================================== 
 
  getById: async (id) => { 
    const response = await api.get( 
      `/audience/${id}` 
    ); 
 
    return response.data; 
  }, 
 
  // ===================================================== 
  // GET MEMBERS
  //
  // Used by the Audience View feature.
  // Admin, Campaign Manager and Communication Team
  // can view audience members according to the existing
  // backend workspace-user permission.
  // ===================================================== 
 
  getMembers: async (id) => { 
    const response = await api.get( 
      `/audience/${id}/members` 
    ); 
 
    return response.data; 
  }, 
 
  // ===================================================== 
  // CREATE 
  // ===================================================== 
 
  create: async (data) => { 
    const response = await api.post( 
      "/audience/", 
      data 
    ); 
 
    return response.data; 
  }, 
 
  // ===================================================== 
  // UPDATE 
  // ===================================================== 
 
  update: async (id, data) => { 
    const response = await api.put( 
      `/audience/${id}`, 
      data 
    ); 
 
    return response.data; 
  }, 
 
  // ===================================================== 
  // DELETE 
  // ===================================================== 
 
  delete: async (id) => { 
    const response = await api.delete( 
      `/audience/${id}` 
    ); 
 
    return response.data; 
  }, 
}; 
 
export default audienceService;