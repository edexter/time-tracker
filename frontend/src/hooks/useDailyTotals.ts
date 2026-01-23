import { useState, useEffect } from 'react'
import type { SessionsResponse, AllocationsResponse, DailyTotals } from '../types'

/**
 * Centralized hook for calculating daily time totals.
 * Single source of truth for: totalClocked, unallocated, totalAllocated, activeElapsedHours
 *
 * Calculation logic:
 *   activeElapsedHours = (now - activeSession.start_time) updated every second
 *   totalClocked = completed_hours + activeElapsedHours
 *   unallocated = totalClocked - totalAllocated
 */
export function useDailyTotals(
  sessionsData: SessionsResponse | undefined,
  allocationsData: AllocationsResponse | undefined
): DailyTotals {
  const [activeElapsedHours, setActiveElapsedHours] = useState(0)

  const activeSession = sessionsData?.active_session || null

  // Track elapsed time for active session (updates every second)
  useEffect(() => {
    if (!activeSession) {
      setActiveElapsedHours(0)
      return
    }

    const calculateElapsed = () => {
      const startTime = new Date(activeSession.start_time)
      const now = new Date()
      const elapsedMs = now.getTime() - startTime.getTime()
      setActiveElapsedHours(elapsedMs / (1000 * 60 * 60))
    }

    calculateElapsed()
    const interval = setInterval(calculateElapsed, 1000)

    return () => clearInterval(interval)
  }, [activeSession])

  // Raw data from backend
  const completedHours = sessionsData?.completed_hours || 0
  const totalAllocated = allocationsData?.total_allocated || 0

  // Derived calculations (single source of truth)
  const totalClocked = completedHours + activeElapsedHours
  const unallocated = totalClocked - totalAllocated

  return {
    totalClocked,
    unallocated,
    totalAllocated,
    activeElapsedHours,
    activeSession
  }
}
