import apiClient from './client'

export const allocationsApi = {
  getByDate: async (date) => {
    const response = await apiClient.get('/allocations', {
      params: { date }
    })
    return response.data
  },

  create: async (allocationData) => {
    const response = await apiClient.post('/allocations', allocationData)
    return response.data
  },

  update: async (id, allocationData) => {
    const response = await apiClient.put(`/allocations/${id}`, allocationData)
    return response.data
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/allocations/${id}`)
    return response.data
  },
}
