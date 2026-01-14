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
      // Build ISO datetime strings without timezone (naive local time)
      // Extract date portion from the session's start_time ISO string
      const dateStr = session.start_time.split('T')[0]

      const updateData = {
        start_time: `${dateStr}T${startTime}:00`
      }

      // Only update end_time for completed sessions
      if (!isActive) {
        const endTime = normalizeTime(editEndTime)
        updateData.end_time = `${dateStr}T${endTime}:00`
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
    <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">Enter Time</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clock In
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clock Out
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map((row, idx) => {
            const isEditing = row.session && editingId === row.session.id
            const isLastRow = idx === rows.length - 1

            return (
              <tr key={idx} className={`hover:bg-gray-50 ${row.type === 'active' ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                {/* Clock In */}
                <td className="px-6 py-2">
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
                      <span className="text-base text-gray-900">
                        {formatTime(row.session.start_time)}
                      </span>
                    )
                  ) : (
                    <span className="text-base text-gray-400">—</span>
                  )}
                </td>

                {/* Clock Out */}
                <td className="px-6 py-2">
                  {row.type === 'active' ? (
                    isEditing ? (
                      <span className="text-base text-gray-400">--:--</span>
                    ) : (
                      <span className="text-base text-gray-400">--:--</span>
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
                      <span className="text-base text-gray-900">
                        {formatTime(row.session.end_time)}
                      </span>
                    )
                  ) : (
                    <span className="text-base text-gray-400">—</span>
                  )}
                </td>

                {/* Total Time */}
                <td className="px-6 py-2">
                  {row.type === 'active' ? (
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                      <span className="text-base font-medium text-blue-600">In Progress</span>
                    </div>
                  ) : row.type === 'completed' ? (
                    <span className="text-base font-medium text-gray-900">
                      {formatDurationHHMM(row.session.duration_hours)}
                    </span>
                  ) : (
                    <span className="text-base text-gray-400">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-6 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {(row.type === 'completed' || row.type === 'active') && !isEditing && (
                        <>
                          <button
                            onClick={() => handleEdit(row.session)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Edit times"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(row.session)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
            <td className="px-6 py-2 text-base text-gray-900" colSpan="2">
              Daily Total
            </td>
            <td className="px-6 py-2 text-base text-gray-900">
              {formatDurationHHMM(getTotalDuration())}
            </td>
            <td className="px-6 py-2"></td>
          </tr>

          {/* Unallocated Row */}
          <tr className={`${unallocated > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
            <td className="px-6 py-2 text-base text-gray-600 font-medium" colSpan="2">
              Unallocated Time
            </td>
            <td className={`px-6 py-2 text-base font-semibold ${unallocated > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
              {formatDurationHHMM(unallocated || 0)}
            </td>
            <td className="px-6 py-2"></td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  )
}
