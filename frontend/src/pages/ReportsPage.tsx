import { useState, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMonthlyReport, useDailyHoursReport, useDailySummary } from '../hooks/useReports'
import MonthlyReportChart from '../components/reports/MonthlyReportChart'
import DailyHoursChart from '../components/reports/DailyHoursChart'
import DailySummaryChart from '../components/reports/DailySummaryChart'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import Button from '../components/shared/Button'

type ReportType = 'monthly' | 'daily' | 'dailySummary'

export default function ReportsPage() {
  const navigate = useNavigate()

  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getCurrentWeek = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    monday.setDate(today.getDate() - daysToMonday)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return { monday, sunday }
  }

  const { monday: defaultMonday, sunday: defaultSunday } = getCurrentWeek()
  const [startDate, setStartDate] = useState(formatDate(defaultMonday))
  const [endDate, setEndDate] = useState(formatDate(defaultSunday))

  const [selectedDate, setSelectedDate] = useState(formatDate(now))

  const [reportType, setReportType] = useState<ReportType>('dailySummary')

  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyReport(
    selectedYear,
    selectedMonth
  )

  const { data: dailyData, isLoading: dailyLoading } = useDailyHoursReport(
    startDate,
    endDate
  )

  const { data: dailySummaryData, isLoading: dailySummaryLoading } = useDailySummary(
    selectedDate
  )

  const loadingByReportType: Record<ReportType, boolean> = {
    monthly: monthlyLoading,
    daily: dailyLoading,
    dailySummary: dailySummaryLoading
  }
  const isLoading = loadingByReportType[reportType]

  const yearOptions = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i)

  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ]

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="bg-white border border-gray-200 rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={() => navigate('/')}>
              <span className="inline-flex items-center">
                <svg
                  className="w-4 h-4 mr-1.5 -mb-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Tracker
              </span>
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-md p-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setReportType('dailySummary')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              reportType === 'dailySummary'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Daily Summary
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              reportType === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Monthly Summary
          </button>
          <button
            onClick={() => setReportType('daily')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              reportType === 'daily'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Daily Hours Trend
          </button>
        </div>
      </div>

      {reportType === 'dailySummary' ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              variant="secondary"
              onClick={() => setSelectedDate(formatDate(new Date()))}
            >
              Today
            </Button>
          </div>
        </div>
      ) : reportType === 'monthly' ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePreviousMonth}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Previous month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex gap-4 items-center">
              <select
                value={selectedMonth}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Next month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2 mt-auto">
              <Button
                variant="secondary"
                onClick={() => {
                  const { monday, sunday } = getCurrentWeek()
                  setStartDate(formatDate(monday))
                  setEndDate(formatDate(sunday))
                }}
              >
                This Week
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const today = new Date()
                  const lastMonth = new Date(today)
                  lastMonth.setDate(today.getDate() - 30)
                  setStartDate(formatDate(lastMonth))
                  setEndDate(formatDate(today))
                }}
              >
                Last 30 Days
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : reportType === 'dailySummary' ? (
        <DailySummaryChart data={dailySummaryData || null} date={selectedDate} />
      ) : reportType === 'monthly' ? (
        <MonthlyReportChart data={monthlyData || null} />
      ) : (
        <DailyHoursChart data={dailyData || null} startDate={startDate} endDate={endDate} />
      )}
    </div>
  )
}
