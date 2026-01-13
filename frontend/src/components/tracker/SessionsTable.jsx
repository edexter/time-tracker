import { useState } from 'react'
import { useClockIn, useClockOut, useDeleteSession } from '../../hooks/useSessions'
import { formatTime, formatDurationHHMM } from '../../utils/formatters'
import Button from '../shared/Button'

export default function SessionsTable({ sessions, activeSession, onUpdate, totalAllocated, unallocated }) {
  const [maxRows, setMaxRows] = useState(3)
  const clockIn = useClockIn()
  const clockOut = useClockOut()
  const deleteSession = useDeleteSession()

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

  const handleDelete = async (id) => {
    if (!confirm('Delete this session?')) return
    try {
      await deleteSession.mutateAsync(id)
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete session')
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
          {rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              {/* Clock In */}
              <td className="px-4 py-3">
                {row.type === 'empty' && !activeSession ? (
                  <Button
                    variant="primary"
                    onClick={() => handleClockIn(row.index)}
                    disabled={clockIn.isPending}
                    className="text-sm py-1 px-3"
                  >
                    Clock In
                  </Button>
                ) : row.session ? (
                  <span className="text-sm text-gray-900">
                    {formatTime(row.session.start_time)}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </td>

              {/* Clock Out */}
              <td className="px-4 py-3">
                {row.type === 'active' ? (
                  <Button
                    variant="danger"
                    onClick={handleClockOut}
                    disabled={clockOut.isPending}
                    className="text-sm py-1 px-3"
                  >
                    Clock Out
                  </Button>
                ) : row.type === 'completed' ? (
                  <span className="text-sm text-gray-900">
                    {formatTime(row.session.end_time)}
                  </span>
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
                {row.type === 'completed' && (
                  <button
                    onClick={() => handleDelete(row.session.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}

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

          {/* Allocated Row */}
          <tr className="bg-gray-50">
            <td className="px-4 py-3 text-sm text-gray-600" colSpan="2">
              Allocated
            </td>
            <td className="px-4 py-3 text-sm text-green-600 font-medium">
              {formatDurationHHMM(totalAllocated || 0)}
            </td>
            <td className="px-4 py-3"></td>
          </tr>

          {/* Unallocated Row */}
          <tr className="bg-gray-50">
            <td className="px-4 py-3 text-sm text-gray-600" colSpan="2">
              Unallocated
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 font-medium">
              {formatDurationHHMM(unallocated || 0)}
            </td>
            <td className="px-4 py-3"></td>
          </tr>
        </tbody>
      </table>

      {/* Add More Rows Button */}
      {rows.length >= maxRows && (
        <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
          <button
            onClick={() => setMaxRows(maxRows + 3)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add More Rows
          </button>
        </div>
      )}
    </div>
  )
}
