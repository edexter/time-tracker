import apiClient from './client'
import type {
  ProjectsResponse,
  ProjectResponse,
  ProjectFormData,
  ProjectUpdateData,
} from '../types'

interface ProjectsParams {
  include_archived: boolean
  client_id?: string
}

export const projectsApi = {
  getAll: async (clientId: string | null | undefined = null, includeArchived = false): Promise<ProjectsResponse> => {
    const params: ProjectsParams = { include_archived: includeArchived }
    if (clientId) params.client_id = clientId

    const response = await apiClient.get<ProjectsResponse>('/projects', { params })
    return response.data
  },

  getById: async (id: string): Promise<ProjectResponse> => {
    const response = await apiClient.get<ProjectResponse>(`/projects/${id}`)
    return response.data
  },

  create: async (projectData: ProjectFormData): Promise<ProjectResponse> => {
    const response = await apiClient.post<ProjectResponse>('/projects', projectData)
    return response.data
  },

  update: async (id: string, projectData: ProjectUpdateData): Promise<ProjectResponse> => {
    const response = await apiClient.put<ProjectResponse>(`/projects/${id}`, projectData)
    return response.data
  },

  archive: async (id: string): Promise<ProjectResponse> => {
    const response = await apiClient.put<ProjectResponse>(`/projects/${id}/archive`)
    return response.data
  },

  restore: async (id: string): Promise<ProjectResponse> => {
    const response = await apiClient.put<ProjectResponse>(`/projects/${id}/restore`)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`)
  },
}
