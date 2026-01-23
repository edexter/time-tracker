import axios, { AxiosInstance, AxiosError } from 'axios'

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for handling auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Redirect to login on unauthorized
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
