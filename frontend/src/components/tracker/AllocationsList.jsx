import { useDeleteAllocation } from '../../hooks/useAllocations'
import { formatDuration } from '../../utils/formatters'

export default function AllocationsList({ allocations, onUpdate }) {
  const deleteAllocation = useDeleteAllocation()

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this allocation?')) return

    try {
      await deleteAllocation.mutateAsync(id)
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete allocation')
    }
  }

  if (allocations.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600">No time allocated yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Time Allocations</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {allocations.map((allocation) => (
          <div key={allocation.id} className="p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="font-medium text-gray-900">{allocation.project_name}</p>
                  <span className="text-sm text-gray-500">· {allocation.client_name}</span>
                </div>
                <p className="text-sm font-semibold text-blue-600">
                  {formatDuration(allocation.hours)}
                </p>
                {allocation.notes && (
                  <p className="text-sm text-gray-600 mt-1">{allocation.notes}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(allocation.id)}
                className="text-red-600 hover:text-red-800 text-sm font-medium ml-4"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
