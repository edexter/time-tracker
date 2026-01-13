import apiClient from './client'

export const authApi = {
  login: async (password) => {
    const response = await apiClient.post('/auth/login', { password })
    return response.data
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout')
    return response.data
  },

  checkAuth: async () => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },
}
