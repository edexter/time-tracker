import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { MonthlyReportItem, DailyHoursItem, DailySummaryItem } from '../types'

export function useMonthlyReport(year: number, month: number) {
  return useQuery<MonthlyReportItem[]>({
    queryKey: ['monthlyReport', year, month],
    queryFn: async () => {
      const response = await apiClient.get<MonthlyReportItem[]>('/reports/monthly-summary', {
        params: { year, month }
      })
      return response.data
    },
    enabled: !!year && !!month,
  })
}

export function useDailyHoursReport(startDate: string, endDate: string) {
  return useQuery<DailyHoursItem[]>({
    queryKey: ['dailyHoursReport', startDate, endDate],
    queryFn: async () => {
      const response = await apiClient.get<DailyHoursItem[]>('/reports/daily-hours', {
        params: { start_date: startDate, end_date: endDate }
      })
      return response.data
    },
    enabled: !!startDate && !!endDate,
  })
}

export function useDailySummary(date: string) {
  return useQuery<DailySummaryItem[]>({
    queryKey: ['dailySummary', date],
    queryFn: async () => {
      const response = await apiClient.get<DailySummaryItem[]>('/reports/daily-summary', {
        params: { date }
      })
      return response.data
    },
    enabled: !!date,
  })
}
