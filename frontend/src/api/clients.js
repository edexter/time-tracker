import apiClient from './client'

export const clientsApi = {
  getAll: async (includeArchived = false) => {
    const response = await apiClient.get('/clients', {
      params: { include_archived: includeArchived }
    })
    return response.data
  },

  getById: async (id) => {
    const response = await apiClient.get(`/clients/${id}`)
    return response.data
  },

  create: async (clientData) => {
    const response = await apiClient.post('/clients', clientData)
    return response.data
  },

  update: async (id, clientData) => {
    const response = await apiClient.put(`/clients/${id}`, clientData)
    return response.data
  },

  archive: async (id) => {
    const response = await apiClient.put(`/clients/${id}/archive`)
    return response.data
  },

  restore: async (id) => {
    const response = await apiClient.put(`/clients/${id}/restore`)
    return response.data
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/clients/${id}`)
    return response.data
  },
}
