import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'

export function useMonthlyReport(year, month) {
  return useQuery({
    queryKey: ['monthlyReport', year, month],
    queryFn: async () => {
      const response = await apiClient.get('/reports/monthly-summary', {
        params: { year, month }
      })
      return response.data
    },
    enabled: !!year && !!month,
  })
}

export function useDailyHoursReport(startDate, endDate) {
  return useQuery({
    queryKey: ['dailyHoursReport', startDate, endDate],
    queryFn: async () => {
      const response = await apiClient.get('/reports/daily-hours', {
        params: { start_date: startDate, end_date: endDate }
      })
      return response.data
    },
    enabled: !!startDate && !!endDate,
  })
}

export function useDailySummary(date) {
  return useQuery({
    queryKey: ['dailySummary', date],
    queryFn: async () => {
      const response = await apiClient.get('/reports/daily-summary', {
        params: { date }
      })
      return response.data
    },
    enabled: !!date,
  })
}
