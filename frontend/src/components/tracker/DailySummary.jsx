import { formatDurationHHMM } from '../../utils/formatters'

export default function DailySummary({ totalClocked, totalAllocated, unallocated, date }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {date ? new Date(date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : 'Daily Summary'}
      </h3>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-600">Total Clocked</p>
          <p className="text-2xl font-bold text-gray-900">{formatDurationHHMM(totalClocked)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Allocated</p>
          <p className="text-2xl font-bold text-green-600">{formatDurationHHMM(totalAllocated)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Unallocated</p>
          <p className="text-2xl font-bold text-gray-400">
            {formatDurationHHMM(unallocated)}
          </p>
        </div>
      </div>
    </div>
  )
}
