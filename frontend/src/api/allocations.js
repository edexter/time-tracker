import apiClient from './client'

// Get current local time as ISO string (for backend timezone consistency)
function getCurrentLocalTime() {
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
  getByDate: async (date) => {
    const response = await apiClient.get('/allocations', {
      params: { date }
    })
    return response.data
  },

  create: async (allocationData) => {
    const response = await apiClient.post('/allocations', {
      ...allocationData,
      current_time: getCurrentLocalTime()
    })
    return response.data
  },

  update: async (id, allocationData) => {
    const response = await apiClient.put(`/allocations/${id}`, {
      ...allocationData,
      current_time: getCurrentLocalTime()
    })
    return response.data
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/allocations/${id}`)
    return response.data
  },
}
