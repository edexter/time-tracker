import { useState } from 'react'
import { useSessions } from '../hooks/useSessions'
import { useAllocations } from '../hooks/useAllocations'
import SessionsTable from '../components/tracker/SessionsTable'
import DailySummary from '../components/tracker/DailySummary'
import AllocationsList from '../components/tracker/AllocationsList'
import AddAllocationForm from '../components/tracker/AddAllocationForm'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import { getToday } from '../utils/formatters'

export default function DailyTrackerPage() {
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

  const handleUpdate = () => {
    refetchSessions()
    refetchAllocations()
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Fixed Date Header */}
      <div className="sticky top-0 bg-white z-10 pb-4 mb-6 flex justify-end">
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">
            {new Date(currentDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Sessions Table */}
          <div>
            <SessionsTable
              sessions={sessions}
              activeSession={activeSession}
              onUpdate={handleUpdate}
              totalAllocated={totalAllocated}
              unallocated={unallocated}
            />
          </div>

          {/* Right Column - Allocations */}
          <div className="space-y-6">
            <AddAllocationForm
              date={currentDate}
              unallocated={unallocated}
              onUpdate={handleUpdate}
            />
            <AllocationsList allocations={allocations} onUpdate={handleUpdate} />
          </div>
        </div>
      </div>
    </div>
  )
}
