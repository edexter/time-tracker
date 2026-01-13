import { useState, useEffect } from 'react'
import { useClockIn, useClockOut } from '../../hooks/useSessions'
import Button from '../shared/Button'
import { formatDuration } from '../../utils/formatters'

export default function TimerControl({ activeSession, onUpdate }) {
  const [elapsed, setElapsed] = useState(0)
  const clockIn = useClockIn()
  const clockOut = useClockOut()

  useEffect(() => {
    if (!activeSession) {
      setElapsed(0)
      return
    }

    const calculateElapsed = () => {
      const start = new Date(activeSession.start_time)
      const now = new Date()
      const seconds = (now - start) / 1000
      const hours = seconds / 3600
      setElapsed(hours)
    }

    calculateElapsed()
    const interval = setInterval(calculateElapsed, 1000)

    return () => clearInterval(interval)
  }, [activeSession])

  const handleClockIn = async () => {
    try {
      await clockIn.mutateAsync()
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to clock in')
    }
  }

  const handleClockOut = async () => {
    try {
      await clockOut.mutateAsync()
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to clock out')
    }
  }

  if (!activeSession) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600 mb-4">Not currently clocked in</p>
        <Button
          onClick={handleClockIn}
          variant="primary"
          disabled={clockIn.isPending}
          className="text-lg px-8 py-3"
        >
          {clockIn.isPending ? 'Clocking In...' : 'Clock In'}
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 text-center">
      <p className="text-sm text-gray-700 mb-2">Currently clocked in</p>
      <p className="text-4xl font-bold text-blue-900 mb-4">
        {formatDuration(elapsed)}
      </p>
      <Button
        onClick={handleClockOut}
        variant="danger"
        disabled={clockOut.isPending}
        className="text-lg px-8 py-3"
      >
        {clockOut.isPending ? 'Clocking Out...' : 'Clock Out'}
      </Button>
    </div>
  )
}
