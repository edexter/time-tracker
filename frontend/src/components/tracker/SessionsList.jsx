import { useDeleteSession } from '../../hooks/useSessions'
import { formatTime, formatDuration } from '../../utils/formatters'

export default function SessionsList({ sessions, onUpdate }) {
  const deleteSession = useDeleteSession()

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this session?')) return

    try {
      await deleteSession.mutateAsync(id)
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete session')
    }
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600">No work sessions for this day</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Work Sessions</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {sessions.map((session) => (
          <div key={session.id} className="p-4 hover:bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">
                  {formatTime(session.start_time)} -{' '}
                  {session.end_time ? formatTime(session.end_time) : 'In Progress'}
                </p>
                {session.duration_hours !== null && (
                  <p className="text-sm text-gray-600">
                    Duration: {formatDuration(session.duration_hours)}
                  </p>
                )}
              </div>
              {!session.is_active && (
                <button
                  onClick={() => handleDelete(session.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
