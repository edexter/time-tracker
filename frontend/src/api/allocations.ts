import apiClient from './client'
import type {
  AllocationsResponse,
  AllocationResponse,
  AllocationFormData,
  AllocationUpdateData,
} from '../types'

// Get current local time as ISO string (for backend timezone consistency)
function getCurrentLocalTime(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

export const allocationsApi = {
  getByDate: async (date: string): Promise<AllocationsResponse> => {
    const response = await apiClient.get<AllocationsResponse>('/allocations', {
      params: { date }
    })
    return response.data
  },

  create: async (allocationData: AllocationFormData): Promise<AllocationResponse> => {
    const response = await apiClient.post<AllocationResponse>('/allocations', {
      ...allocationData,
      current_time: getCurrentLocalTime()
    })
    return response.data
  },

  update: async (id: string, allocationData: AllocationUpdateData): Promise<AllocationResponse> => {
    const response = await apiClient.put<AllocationResponse>(`/allocations/${id}`, {
      ...allocationData,
      current_time: getCurrentLocalTime()
    })
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/allocations/${id}`)
  },
}
