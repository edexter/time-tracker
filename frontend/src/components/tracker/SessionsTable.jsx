import { useState } from 'react'
import { useClockIn, useClockOut, useDeleteSession, useUpdateSession } from '../../hooks/useSessions'
import { formatTime, formatDurationHHMM } from '../../utils/formatters'
import Button from '../shared/Button'

export default function SessionsTable({ sessions, activeSession, onUpdate, totalAllocated, unallocated }) {
  const [maxRows, setMaxRows] = useState(3)
  const [editingId, setEditingId] = useState(null)
  const [editStartTime, setEditStartTime] = useState('')
  const [editEndTime, setEditEndTime] = useState('')
  const clockIn = useClockIn()
  const clockOut = useClockOut()
  const deleteSession = useDeleteSession()
  const updateSession = useUpdateSession()

  // Calculate total duration including active session
  const getTotalDuration = () => {
    let total = 0
    sessions.forEach(s => {
      if (s.duration_hours) total += s.duration_hours
    })
    return total
  }

  const handleClockIn = async (rowIndex) => {
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

  const handleDelete = async (session) => {
    if (session.is_active || !session.end_time) {
      alert('You need to clock out before deleting a running entry')
      return
    }
    if (!confirm('Delete this session?')) return
    try {
      await deleteSession.mutateAsync(session.id)
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete session')
    }
  }

  const handleEdit = (session) => {
    setEditingId(session.id)
    setEditStartTime(formatTime(session.start_time))
    setEditEndTime(formatTime(session.end_time))
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditStartTime('')
    setEditEndTime('')
  }

  const normalizeTime = (timeStr) => {
    // Accept formats like "9:30" or "09:30"
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/)
    if (!match) return null
    const hours = match[1].padStart(2, '0')
    const minutes = match[2]
    if (parseInt(hours) > 23 || parseInt(minutes) > 59) return null
    return `${hours}:${minutes}`
  }

  const handleSaveEdit = async (session) => {
    const startTime = normalizeTime(editStartTime)

    if (!startTime) {
      alert('Invalid time format. Use HH:MM format (e.g., 09:30 or 9:30)')
      return
    }

    // For active sessions, only validate and update start time
    const isActive = !session.end_time

    if (!isActive) {
      const endTime = normalizeTime(editEndTime)

      if (!endTime) {
        alert('Invalid time format. Use HH:MM format (e.g., 09:30 or 9:30)')
        return
      }

      // Check that end time is after start time (no midnight spanning)
      if (endTime <= startTime) {
        alert('End time must be after start time. Sessions cannot span midnight.')
        return
      }
    }

    try {
      // Build ISO datetime strings using the session's date in local timezone
      const sessionDate = new Date(session.start_time)
      const year = sessionDate.getFullYear()
      const month = String(sessionDate.getMonth() + 1).padStart(2, '0')
      const day = String(sessionDate.getDate()).padStart(2, '0')

      // Create datetime in local timezone, then convert to ISO
      const [startHours, startMinutes] = startTime.split(':')
      const newStartDate = new Date(year, sessionDate.getMonth(), sessionDate.getDate(), parseInt(startHours), parseInt(startMinutes))

      const updateData = {
        start_time: newStartDate.toISOString()
      }

      // Only update end_time for completed sessions
      if (!isActive) {
        const endTime = normalizeTime(editEndTime)
        const [endHours, endMinutes] = endTime.split(':')
        const newEndDate = new Date(year, sessionDate.getMonth(), sessionDate.getDate(), parseInt(endHours), parseInt(endMinutes))
        updateData.end_time = newEndDate.toISOString()
      }

      await updateSession.mutateAsync({
        id: session.id,
        data: updateData
      })
      setEditingId(null)
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update session')
    }
  }

  // Create rows: show all sessions + empty rows up to maxRows
  const rows = []
  const completedSessions = sessions.filter(s => !s.is_active)

  // Add completed sessions
  completedSessions.forEach((session, index) => {
    rows.push({ type: 'completed', session, index })
  })

  // Add active session if exists
  if (activeSession) {
    rows.push({ type: 'active', session: activeSession })
  }

  // Add empty rows to reach maxRows
  const emptyRowsNeeded = maxRows - rows.length
  for (let i = 0; i < emptyRowsNeeded; i++) {
    rows.push({ type: 'empty', index: rows.length })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Time Entries</h3>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Clock In
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Clock Out
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Time
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map((row, idx) => {
            const isEditing = row.session && editingId === row.session.id
            const isLastRow = idx === rows.length - 1

            return (
              <tr key={idx} className="hover:bg-gray-50">
                {/* Clock In */}
                <td className="px-4 py-3">
                  {row.session ? (
                    isEditing ? (
                      <input
                        type="text"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        placeholder="HH:MM"
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">
                        {formatTime(row.session.start_time)}
                      </span>
                    )
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>

                {/* Clock Out */}
                <td className="px-4 py-3">
                  {row.type === 'active' ? (
                    isEditing ? (
                      <span className="text-sm text-gray-400">--:--</span>
                    ) : (
                      <span className="text-sm text-gray-400">--:--</span>
                    )
                  ) : row.type === 'completed' ? (
                    isEditing ? (
                      <input
                        type="text"
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        placeholder="HH:MM"
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">
                        {formatTime(row.session.end_time)}
                      </span>
                    )
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>

                {/* Total Time */}
                <td className="px-4 py-3">
                  {row.type === 'active' ? (
                    <span className="text-sm font-medium text-blue-600">In Progress</span>
                  ) : row.type === 'completed' ? (
                    <span className="text-sm font-medium text-gray-900">
                      {formatDurationHHMM(row.session.duration_hours)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {(row.type === 'completed' || row.type === 'active') && !isEditing && (
                        <>
                          <button
                            onClick={() => handleEdit(row.session)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                            title="Edit times"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(row.session)}
                            className="text-red-600 hover:text-red-800 text-sm"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                      {(row.type === 'completed' || row.type === 'active') && isEditing && (
                        <>
                          <button
                            onClick={() => handleSaveEdit(row.session)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                    {isLastRow && rows.length >= maxRows && (
                      <button
                        onClick={() => setMaxRows(maxRows + 1)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        title="Add more rows"
                      >
                        + Row
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}

          {/* Total Row */}
          <tr className="bg-gray-50 font-semibold">
            <td className="px-4 py-3 text-sm text-gray-900" colSpan="2">
              Daily Total
            </td>
            <td className="px-4 py-3 text-sm text-gray-900">
              {formatDurationHHMM(getTotalDuration())}
            </td>
            <td className="px-4 py-3"></td>
          </tr>

          {/* Unallocated Row */}
          <tr className="bg-gray-50">
            <td className="px-4 py-3 text-sm text-gray-600" colSpan="2">
              Unallocated
            </td>
            <td className="px-4 py-3 text-sm text-orange-500 font-medium">
              {formatDurationHHMM(unallocated || 0)}
            </td>
            <td className="px-4 py-3"></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
