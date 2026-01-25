import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { useSessions, useClockIn, useClockOut } from '../hooks/useSessions'
import { useAllocations } from '../hooks/useAllocations'
import { useDailyTotals } from '../hooks/useDailyTotals'
import SessionsTable from '../components/tracker/SessionsTable'
import AllocationsList from '../components/tracker/AllocationsList'
import AddAllocationForm from '../components/tracker/AddAllocationForm'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import Button from '../components/shared/Button'
import { getToday } from '../utils/formatters'

export default function DailyTrackerPage() {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(getToday())
  const [showCalendar, setShowCalendar] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    refetch: refetchSessions
  } = useSessions(currentDate)

  const {
    data: allocationsData,
    isLoading: allocationsLoading,
    refetch: refetchAllocations
  } = useAllocations(currentDate)

  const {
    unallocated,
    activeElapsedHours,
    activeSession
  } = useDailyTotals(sessionsData, allocationsData)

  const clockIn = useClockIn()
  const clockOut = useClockOut()

  const handleUpdate = () => {
    refetchSessions()
    refetchAllocations()
  }

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false)
      }
    }

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCalendar])

  const handleClockIn = async () => {
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      const localTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`

      await clockIn.mutateAsync(localTime)
      handleUpdate()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      alert(err.response?.data?.error || 'Failed to clock in')
    }
  }

  const handleClockOut = async () => {
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      const localTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`

      await clockOut.mutateAsync(localTime)
      handleUpdate()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      alert(err.response?.data?.error || 'Failed to clock out')
    }
  }

  if (sessionsLoading || allocationsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const sessions = sessionsData?.sessions || []
  const allocations = allocationsData?.allocations || []

  const handlePreviousDay = () => {
    const prevDate = new Date(currentDate)
    prevDate.setDate(prevDate.getDate() - 1)
    setCurrentDate(prevDate.toISOString().split('T')[0])
  }

  const handleNextDay = () => {
    const nextDate = new Date(currentDate)
    nextDate.setDate(nextDate.getDate() + 1)
    setCurrentDate(nextDate.toISOString().split('T')[0])
  }

  const handleToday = () => {
    setCurrentDate(getToday())
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      setCurrentDate(`${year}-${month}-${day}`)
      setShowCalendar(false)
    }
  }

  const toggleCalendar = () => {
    setShowCalendar(!showCalendar)
  }

  const isToday = currentDate === getToday()

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="sticky top-0 bg-white border border-gray-200 rounded-xl shadow-md z-10 p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2 flex-wrap">
            {activeSession ? (
              <Button
                variant="danger"
                onClick={handleClockOut}
                disabled={clockOut.isPending}
              >
                <span className="inline-flex items-center">
                  <svg className="w-4 h-4 mr-1.5 -mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Clock Out
                </span>
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleClockIn}
                disabled={clockIn.isPending}
              >
                <span className="inline-flex items-center">
                  <svg className="w-4 h-4 mr-1.5 -mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Clock In
                </span>
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => navigate('/clients')}
            >
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 mr-1.5 -mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage Clients/Projects
              </span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/reports')}
            >
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 mr-1.5 -mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Reports
              </span>
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={calendarRef}>
              <button
                onClick={toggleCalendar}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Select date"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>

              {showCalendar && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <DayPicker
                    mode="single"
                    onSelect={handleDateSelect}
                    defaultMonth={new Date(currentDate)}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center">
              <button
                onClick={handlePreviousDay}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Previous day"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="text-center min-w-[150px] relative">
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(currentDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
                {!isToday && (
                  <button
                    onClick={handleToday}
                    className="absolute left-1/2 -translate-x-1/2 top-full text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                  >
                    Jump to Today
                  </button>
                )}
              </div>

              <button
                onClick={handleNextDay}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Next day"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-5">
            <SessionsTable
              sessions={sessions}
              activeSession={activeSession}
              activeElapsedHours={activeElapsedHours}
              onUpdate={handleUpdate}
              unallocated={unallocated}
              date={currentDate}
            />
            <AddAllocationForm
              date={currentDate}
              unallocated={unallocated}
              onUpdate={handleUpdate}
            />
          </div>

          <div>
            <AllocationsList allocations={allocations} onUpdate={handleUpdate} />
          </div>
        </div>
      </div>
    </div>
  )
}
