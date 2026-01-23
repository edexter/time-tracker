import apiClient from './client'
import type {
  ClientsResponse,
  ClientResponse,
  ClientFormData,
  ClientUpdateData,
} from '../types'

export const clientsApi = {
  getAll: async (includeArchived = false): Promise<ClientsResponse> => {
    const response = await apiClient.get<ClientsResponse>('/clients', {
      params: { include_archived: includeArchived }
    })
    return response.data
  },

  getById: async (id: string): Promise<ClientResponse> => {
    const response = await apiClient.get<ClientResponse>(`/clients/${id}`)
    return response.data
  },

  create: async (clientData: ClientFormData): Promise<ClientResponse> => {
    const response = await apiClient.post<ClientResponse>('/clients', clientData)
    return response.data
  },

  update: async (id: string, clientData: ClientUpdateData): Promise<ClientResponse> => {
    const response = await apiClient.put<ClientResponse>(`/clients/${id}`, clientData)
    return response.data
  },

  archive: async (id: string): Promise<ClientResponse> => {
    const response = await apiClient.put<ClientResponse>(`/clients/${id}/archive`)
    return response.data
  },

  restore: async (id: string): Promise<ClientResponse> => {
    const response = await apiClient.put<ClientResponse>(`/clients/${id}/restore`)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/clients/${id}`)
  },
}
