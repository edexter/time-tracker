import apiClient from './client'
import type {
  SessionsResponse,
  SessionResponse,
  SessionFormData,
  SessionUpdateData,
} from '../types'

export const sessionsApi = {
  getByDate: async (date: string): Promise<SessionsResponse> => {
    const response = await apiClient.get<SessionsResponse>('/sessions', {
      params: { date }
    })
    return response.data
  },

  clockIn: async (time: string | null = null): Promise<SessionResponse> => {
    const response = await apiClient.post<SessionResponse>('/sessions/clock-in', time ? { time } : {})
    return response.data
  },

  clockOut: async (time: string | null = null): Promise<SessionResponse> => {
    const response = await apiClient.post<SessionResponse>('/sessions/clock-out', time ? { time } : {})
    return response.data
  },

  create: async (sessionData: SessionFormData): Promise<SessionResponse> => {
    const response = await apiClient.post<SessionResponse>('/sessions', sessionData)
    return response.data
  },

  update: async (id: string, sessionData: SessionUpdateData): Promise<SessionResponse> => {
    const response = await apiClient.put<SessionResponse>(`/sessions/${id}`, sessionData)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/sessions/${id}`)
  },
}
