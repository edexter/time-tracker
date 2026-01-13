import apiClient from './client'

export const projectsApi = {
  getAll: async (clientId = null, includeArchived = false) => {
    const params = { include_archived: includeArchived }
    if (clientId) params.client_id = clientId

    const response = await apiClient.get('/projects', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await apiClient.get(`/projects/${id}`)
    return response.data
  },

  create: async (projectData) => {
    const response = await apiClient.post('/projects', projectData)
    return response.data
  },

  update: async (id, projectData) => {
    const response = await apiClient.put(`/projects/${id}`, projectData)
    return response.data
  },

  archive: async (id) => {
    const response = await apiClient.put(`/projects/${id}/archive`)
    return response.data
  },

  restore: async (id) => {
    const response = await apiClient.put(`/projects/${id}/restore`)
    return response.data
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/projects/${id}`)
    return response.data
  },
}
