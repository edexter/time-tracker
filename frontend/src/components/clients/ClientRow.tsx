import { MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Client } from '../../types'

export interface ClientRowProps {
  client: Client
  onEdit: (client: Client) => void
  onArchive: (id: string) => void
  onRestore: (id: string) => void
  onDelete: (client: Client) => void
}

export default function ClientRow({ client, onEdit, onArchive, onRestore, onDelete }: ClientRowProps) {
  const navigate = useNavigate()
  const budgetPercentage = client.hour_budget
    ? ((client.hours_logged || 0) / client.hour_budget) * 100
    : null

  const getBudgetColor = () => {
    if (!budgetPercentage) return 'bg-gray-200'
    if (budgetPercentage >= 100) return 'bg-red-500'
    if (budgetPercentage >= 80) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}:${m.toString().padStart(2, '0')}`
  }

  const handleCardClick = (e: MouseEvent<HTMLDivElement>) => {
    // Don't navigate if clicking on action buttons
    const target = e.target as HTMLElement
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return
    }
    navigate(`/clients/${client.id}`)
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-white border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
            {client.short_name && (
              <span className="text-base text-gray-500">{client.short_name}</span>
            )}
            {client.is_archived && (
              <span className="inline-block px-2 py-0.5 text-sm font-medium text-gray-600 bg-gray-200 rounded">
                Archived
              </span>
            )}
          </div>

          {/* Budget Progress */}
          {client.hour_budget ? (
            <div className="mt-2">
              <div className="flex justify-between text-base text-gray-600 mb-1">
                <span>Budget</span>
                <span>
                  {formatHours(client.hours_logged || 0)} / {formatHours(client.hour_budget)}
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
            <p className="text-base text-gray-500 mt-1">
              {formatHours(client.hours_logged || 0)} logged · No budget set
            </p>
          )}
        </div>

        <div className="flex gap-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(client)
            }}
            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {!client.is_archived ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onArchive(client.id)
                }}
                className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50 transition-colors"
                title="Archive"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(client)
                }}
                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRestore(client.id)
              }}
              className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors"
              title="Restore"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
