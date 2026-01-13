import Button from '../shared/Button'

export default function ClientRow({ client, onEdit, onArchive, onRestore, onDelete }) {
  const budgetPercentage = client.hour_budget
    ? (client.hours_logged / client.hour_budget) * 100
    : null

  const getBudgetColor = () => {
    if (!budgetPercentage) return 'bg-gray-200'
    if (budgetPercentage >= 100) return 'bg-red-500'
    if (budgetPercentage >= 80) return 'bg-amber-500'
    return 'bg-green-500'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
          <p className="text-sm text-gray-600">
            {client.currency} {client.default_hourly_rate}/hour
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(client)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
          {!client.is_archived ? (
            <>
              <button
                onClick={() => onArchive(client.id)}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Archive
              </button>
              <button
                onClick={() => onDelete(client)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Delete
              </button>
            </>
          ) : (
            <button
              onClick={() => onRestore(client.id)}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Restore
            </button>
          )}
        </div>
      </div>

      {/* Budget Progress */}
      {client.hour_budget ? (
        <div className="mt-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Budget</span>
            <span>
              {client.hours_logged.toFixed(2)}h / {client.hour_budget}h
              {budgetPercentage && ` (${budgetPercentage.toFixed(0)}%)`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getBudgetColor()} transition-all`}
              style={{ width: `${Math.min(budgetPercentage || 0, 100)}%` }}
            ></div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 mt-2">
          {client.hours_logged.toFixed(2)}h logged · No budget set
        </p>
      )}

      {client.is_archived && (
        <div className="mt-2">
          <span className="inline-block px-2 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded">
            Archived
          </span>
        </div>
      )}
    </div>
  )
}
