import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessions, useClockIn, useClockOut } from '../hooks/useSessions'
import { useAllocations } from '../hooks/useAllocations'
import SessionsTable from '../components/tracker/SessionsTable'
import DailySummary from '../components/tracker/DailySummary'
import AllocationsList from '../components/tracker/AllocationsList'
import AddAllocationForm from '../components/tracker/AddAllocationForm'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import Button from '../components/shared/Button'
import { getToday } from '../utils/formatters'

export default function DailyTrackerPage() {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(getToday())

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

  const clockIn = useClockIn()
  const clockOut = useClockOut()

  const handleUpdate = () => {
    refetchSessions()
    refetchAllocations()
  }

  const handleClockIn = async () => {
    try {
      await clockIn.mutateAsync()
      handleUpdate()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to clock in')
    }
  }

  const handleClockOut = async () => {
    try {
      await clockOut.mutateAsync()
      handleUpdate()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to clock out')
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
  const activeSession = sessionsData?.active_session || null
  const totalClocked = sessionsData?.total_hours || 0

  const allocations = allocationsData?.allocations || []
  const totalAllocated = allocationsData?.total_allocated || 0
  const unallocated = allocationsData?.unallocated || 0

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

  const isToday = currentDate === getToday()

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Fixed Header with Clock In/Out and Date */}
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
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePreviousDay}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Previous day"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center min-w-[200px]">
              <p className="text-base font-semibold text-gray-900">
                {new Date(currentDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
              {!isToday && (
                <button
                  onClick={handleToday}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
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

      <div className="grid gap-5">
        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-5">
          {/* Left Column - Sessions Table and Allocation Form */}
          <div className="space-y-5">
            <SessionsTable
              sessions={sessions}
              activeSession={activeSession}
              onUpdate={handleUpdate}
              totalAllocated={totalAllocated}
              unallocated={unallocated}
            />
            <AddAllocationForm
              date={currentDate}
              unallocated={unallocated}
              onUpdate={handleUpdate}
            />
          </div>

          {/* Right Column - Allocations List */}
          <div>
            <AllocationsList allocations={allocations} onUpdate={handleUpdate} />
          </div>
        </div>
      </div>
    </div>
  )
}
