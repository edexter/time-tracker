import apiClient from './client'
import type { AuthCheckResponse, AuthLoginResponse } from '../types'

export const authApi = {
  login: async (password: string): Promise<AuthLoginResponse> => {
    const response = await apiClient.post<AuthLoginResponse>('/auth/login', { password })
    return response.data
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/logout')
    return response.data
  },

  checkAuth: async (): Promise<AuthCheckResponse> => {
    const response = await apiClient.get<AuthCheckResponse>('/auth/me')
    return response.data
  },
}
