import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useDeleteSession, useUpdateSession, useCreateSession } from '../../hooks/useSessions'
import { formatTime, formatDurationHHMM } from '../../utils/formatters'
import type { WorkSession } from '../../types'

export interface SessionsTableProps {
  sessions: WorkSession[]
  activeSession: WorkSession | null
  activeElapsedHours?: number
  onUpdate: () => void
  unallocated: number
  date: string
}

type InputMode =
  | null
  | { mode: 'edit'; sessionId: string; field: 'start' | 'end' }
  | { mode: 'create'; rowIndex: number; field: 'start' | 'end' }

type RowType =
  | { type: 'completed'; session: WorkSession; index: number }
  | { type: 'active'; session: WorkSession }
  | { type: 'empty'; index: number }

export default function SessionsTable({ sessions, activeSession, activeElapsedHours = 0, onUpdate, unallocated, date }: SessionsTableProps) {
  const [maxRows, setMaxRows] = useState(3)
  const [inputMode, setInputMode] = useState<InputMode>(null)
  const [inputValue, setInputValue] = useState('')
  const [originalValue, setOriginalValue] = useState('')
  const [pendingCreateStart, setPendingCreateStart] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const deleteSession = useDeleteSession()
  const updateSession = useUpdateSession()
  const createSession = useCreateSession()

  useEffect(() => {
    if (inputMode !== null && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [inputMode])

  const getTotalDuration = () => {
    let total = 0
    sessions.forEach(s => {
      if (s.duration_hours) total += s.duration_hours
    })
    if (activeSession) {
      total += activeElapsedHours
    }
    return total
  }

  const handleDelete = async (session: WorkSession) => {
    if (session.is_active || !session.end_time) {
      alert('You need to clock out before deleting a running entry')
      return
    }
    if (!confirm('Delete this session?')) return
    try {
      await deleteSession.mutateAsync(session.id)
      onUpdate()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      alert(err.response?.data?.error || 'Failed to delete session')
    }
  }

  const normalizeTime = (timeStr: string): string | null => {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/)
    if (!match) return null
    const hours = match[1].padStart(2, '0')
    const minutes = match[2]
    if (parseInt(hours) > 23 || parseInt(minutes) > 59) return null
    return `${hours}:${minutes}`
  }

  const handleCancel = () => {
    setInputMode(null)
    setInputValue('')
    setOriginalValue('')
    setPendingCreateStart('')
  }

  const handleStartEdit = (session: WorkSession, field: 'start' | 'end') => {
    const value = field === 'start'
      ? formatTime(session.start_time)
      : formatTime(session.end_time || '')
    setInputMode({ mode: 'edit', sessionId: session.id, field })
    setInputValue(value)
    setOriginalValue(value)
  }

  const handleStartCreate = (rowIndex: number) => {
    setInputMode({ mode: 'create', rowIndex, field: 'start' })
    setInputValue('')
    setPendingCreateStart('')
  }

  const handleSaveField = async (session: WorkSession) => {
    const newTime = normalizeTime(inputValue)

    if (inputValue === originalValue) {
      handleCancel()
      return
    }

    if (!newTime) {
      alert('Invalid time format. Use HH:MM (e.g., 09:30 or 9:30)')
      handleCancel()
      return
    }

    const isActive = !session.end_time
    const field = inputMode?.mode === 'edit' ? inputMode.field : null
    const dateStr = session.start_time.split('T')[0]

    const updateData: { start_time?: string; end_time?: string } = {}

    if (field === 'start') {
      updateData.start_time = `${dateStr}T${newTime}:00`

      if (!isActive) {
        const currentEnd = formatTime(session.end_time || '')
        if (currentEnd <= newTime) {
          alert('Start time must be before end time.')
          handleCancel()
          return
        }
      }
    } else {
      updateData.end_time = `${dateStr}T${newTime}:00`
      const currentStart = formatTime(session.start_time)
      if (newTime <= currentStart) {
        alert('End time must be after start time.')
        handleCancel()
        return
      }
    }

    try {
      await updateSession.mutateAsync({
        id: session.id,
        data: updateData
      })
      handleCancel()
      onUpdate()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      alert(err.response?.data?.error || 'Failed to update session')
      handleCancel()
    }
  }

  const handleCreateAdvanceToEnd = () => {
    const normalized = normalizeTime(inputValue)
    if (!normalized) {
      alert('Invalid time format. Use HH:MM (e.g., 09:30 or 9:30)')
      return
    }
    if (inputMode?.mode !== 'create') return

    setPendingCreateStart(normalized)
    setInputValue('')
    setInputMode({ ...inputMode, field: 'end' })
  }

  const handleCreateSubmit = async () => {
    const endNorm = normalizeTime(inputValue)
    if (!pendingCreateStart || !endNorm) {
      alert('Invalid time format. Use HH:MM (e.g., 09:30 or 9:30)')
      return
    }
    if (endNorm <= pendingCreateStart) {
      alert('End time must be after start time.')
      return
    }
    try {
      await createSession.mutateAsync({
        date,
        start_time: `${date}T${pendingCreateStart}:00`,
        end_time: `${date}T${endNorm}:00`,
      })
      handleCancel()
      onUpdate()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      alert(err.response?.data?.error || 'Failed to create session')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
      return
    }
    if (e.key !== 'Enter' && e.key !== 'Tab') return
    if (inputMode === null) return

    e.preventDefault()
    if (inputMode.mode === 'edit') {
      const session = sessions.find(s => s.id === inputMode.sessionId) || activeSession
      if (session) handleSaveField(session)
    } else {
      if (inputMode.field === 'start') {
        handleCreateAdvanceToEnd()
      } else {
        handleCreateSubmit()
      }
    }
  }

  const handleBlur = () => {
    if (inputMode === null) return

    if (inputMode.mode === 'edit') {
      const session = sessions.find(s => s.id === inputMode.sessionId) || activeSession
      if (session) handleSaveField(session)
    } else {
      if (inputMode.field === 'start' && !inputValue.trim()) {
        handleCancel()
      } else if (inputMode.field === 'end') {
        if (pendingCreateStart && inputValue.trim()) {
          handleCreateSubmit()
        } else if (!inputValue.trim()) {
          handleCancel()
        }
      }
    }
  }

  const renderTimeInput = () => (
    <input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="HH:MM"
      className="w-20 px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
    />
  )

  const rows: RowType[] = []
  const completedSessions = sessions.filter(s => !s.is_active)

  completedSessions.forEach((session, index) => {
    rows.push({ type: 'completed', session, index })
  })

  if (activeSession) {
    rows.push({ type: 'active', session: activeSession })
  }

  const emptyRowsNeeded = maxRows - rows.length
  for (let i = 0; i < emptyRowsNeeded; i++) {
    rows.push({ type: 'empty', index: rows.length })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">Enter Time</h3>
      </div>

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
            const session = row.type !== 'empty' ? row.session : null
            const emptyRowIndex = row.type === 'empty' ? row.index : -1
            const isEditingStart = inputMode?.mode === 'edit' && session && inputMode.sessionId === session.id && inputMode.field === 'start'
            const isEditingEnd = inputMode?.mode === 'edit' && session && inputMode.sessionId === session.id && inputMode.field === 'end'
            const isCreatingStart = inputMode?.mode === 'create' && row.type === 'empty' && inputMode.rowIndex === emptyRowIndex && inputMode.field === 'start'
            const isCreatingEnd = inputMode?.mode === 'create' && row.type === 'empty' && inputMode.rowIndex === emptyRowIndex && inputMode.field === 'end'
            const isLastRow = idx === rows.length - 1

            return (
              <tr key={idx} className={`hover:bg-gray-50 ${row.type === 'active' ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                <td className="px-6 py-2">
                  {session ? (
                    isEditingStart ? (
                      renderTimeInput()
                    ) : (
                      <span
                        onClick={() => handleStartEdit(session, 'start')}
                        className="text-base text-gray-900 px-2 py-1 -mx-2 rounded cursor-text hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 transition-colors"
                        title="Click to edit"
                      >
                        {formatTime(session.start_time)}
                      </span>
                    )
                  ) : isCreatingStart ? (
                    renderTimeInput()
                  ) : isCreatingEnd ? (
                    <span className="text-base text-gray-900">{pendingCreateStart}</span>
                  ) : (
                    <span
                      onClick={() => handleStartCreate(emptyRowIndex)}
                      className="text-base text-gray-400 px-2 py-1 -mx-2 rounded cursor-text hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 hover:text-blue-600 transition-colors"
                      title="Click to add session"
                    >
                      —
                    </span>
                  )}
                </td>

                <td className="px-6 py-2">
                  {row.type === 'active' ? (
                    <span className="text-base text-gray-400">--:--</span>
                  ) : row.type === 'completed' ? (
                    isEditingEnd ? (
                      renderTimeInput()
                    ) : (
                      <span
                        onClick={() => handleStartEdit(row.session, 'end')}
                        className="text-base text-gray-900 px-2 py-1 -mx-2 rounded cursor-text hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 transition-colors"
                        title="Click to edit"
                      >
                        {formatTime(row.session.end_time || '')}
                      </span>
                    )
                  ) : isCreatingEnd ? (
                    renderTimeInput()
                  ) : isCreatingStart ? (
                    <span className="text-base text-gray-400">—</span>
                  ) : (
                    <span
                      onClick={() => handleStartCreate(emptyRowIndex)}
                      className="text-base text-gray-400 px-2 py-1 -mx-2 rounded cursor-text hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 hover:text-blue-600 transition-colors"
                      title="Click to add session"
                    >
                      —
                    </span>
                  )}
                </td>

                <td className="px-6 py-2">
                  {row.type === 'active' ? (
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                      <span className="text-base font-medium text-blue-600">
                        {formatDurationHHMM(activeElapsedHours)}
                      </span>
                    </div>
                  ) : row.type === 'completed' ? (
                    <span className="text-base font-medium text-gray-900">
                      {formatDurationHHMM(row.session.duration_hours || 0)}
                    </span>
                  ) : (
                    <span className="text-base text-gray-400">—</span>
                  )}
                </td>

                <td className="px-6 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {(row.type === 'completed' || row.type === 'active') && (
                        <button
                          onClick={() => handleDelete(row.session)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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

          <tr className="bg-gray-50 font-semibold">
            <td className="px-6 py-2 text-base text-gray-900" colSpan={2}>
              Daily Total
            </td>
            <td className="px-6 py-2 text-base text-gray-900">
              {formatDurationHHMM(getTotalDuration())}
            </td>
            <td className="px-6 py-2"></td>
          </tr>

          <tr className={`${unallocated > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
            <td className="px-6 py-2 text-base text-gray-600 font-medium" colSpan={2}>
              Unallocated Time
            </td>
            <td className={`px-6 py-2 text-base font-semibold ${unallocated > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
              {formatDurationHHMM(unallocated)}
            </td>
            <td className="px-6 py-2"></td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  )
}
