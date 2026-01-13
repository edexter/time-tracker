import apiClient from './client'

export const sessionsApi = {
  getByDate: async (date) => {
    const response = await apiClient.get('/sessions', {
      params: { date }
    })
    return response.data
  },

  clockIn: async (time = null) => {
    const response = await apiClient.post('/sessions/clock-in', time ? { time } : {})
    return response.data
  },

  clockOut: async (time = null) => {
    const response = await apiClient.post('/sessions/clock-out', time ? { time } : {})
    return response.data
  },

  create: async (sessionData) => {
    const response = await apiClient.post('/sessions', sessionData)
    return response.data
  },

  update: async (id, sessionData) => {
    const response = await apiClient.put(`/sessions/${id}`, sessionData)
    return response.data
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/sessions/${id}`)
    return response.data
  },
}
