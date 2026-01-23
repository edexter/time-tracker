import { useState, ChangeEvent } from 'react'
import { useDeleteAllocation, useUpdateAllocation } from '../../hooks/useAllocations'
import { useProjects } from '../../hooks/useProjects'
import { formatDurationHHMM } from '../../utils/formatters'
import type { TimeAllocation, SelectOption } from '../../types'

export interface AllocationsListProps {
  allocations: TimeAllocation[]
  onUpdate: () => void
}

interface EditFormData {
  project_id: string
  hours: string
  notes: string
}

export default function AllocationsList({ allocations, onUpdate }: AllocationsListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<EditFormData>({
    project_id: '',
    hours: '',
    notes: ''
  })

  const deleteAllocation = useDeleteAllocation()
  const updateAllocation = useUpdateAllocation()
  const { data: projectsData } = useProjects(null, false)
  const projects = projectsData?.projects || []

  const formatTimeInput = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}:${m.toString().padStart(2, '0')}`
  }

  const parseTimeInput = (timeStr: string): number => {
    const parts = timeStr.split(':')
    if (parts.length !== 2) return parseFloat(timeStr)
    const h = parseInt(parts[0])
    const m = parseInt(parts[1])
    if (isNaN(h) || isNaN(m) || m < 0 || m >= 60) return parseFloat(timeStr)
    return h + (m / 60)
  }

  const handleEdit = (allocation: TimeAllocation) => {
    setEditingId(allocation.id)
    setEditFormData({
      project_id: allocation.project_id,
      hours: formatTimeInput(allocation.hours),
      notes: allocation.notes || ''
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditFormData({ project_id: '', hours: '', notes: '' })
  }

  const handleSaveEdit = async (id: string) => {
    const hours = parseTimeInput(editFormData.hours)
    if (hours <= 0 || isNaN(hours)) {
      alert('Hours must be greater than 0. Use H:MM format (e.g., 0:56 for 56 minutes)')
      return
    }

    try {
      await updateAllocation.mutateAsync({
        id,
        data: {
          project_id: editFormData.project_id,
          hours,
          notes: editFormData.notes || null
        }
      })
      setEditingId(null)
      onUpdate()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      alert(err.response?.data?.error || 'Failed to update allocation')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this allocation?')) return

    try {
      await deleteAllocation.mutateAsync(id)
      onUpdate()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      alert(err.response?.data?.error || 'Failed to delete allocation')
    }
  }

  // Group projects by client for dropdown
  const projectOptions: SelectOption[] = []
  const projectsByClient = projects.reduce<Record<string, typeof projects>>((acc, project) => {
    if (!acc[project.client_name]) {
      acc[project.client_name] = []
    }
    acc[project.client_name].push(project)
    return acc
  }, {})

  Object.entries(projectsByClient).forEach(([clientName, clientProjects]) => {
    projectOptions.push({
      value: `client-${clientName}`,
      label: `── ${clientName} ──`,
      disabled: true
    })
    clientProjects.forEach((project) => {
      projectOptions.push({
        value: project.id,
        label: `  ${project.name}`
      })
    })
  })

  if (allocations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 text-center">
        <p className="text-gray-500">No time allocated yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">Review Allocations</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {allocations.map((allocation) => {
          const isEditing = editingId === allocation.id

          return (
            <div key={allocation.id} className="p-3 hover:bg-gray-50">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
                    <select
                      value={editFormData.project_id}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditFormData({ ...editFormData, project_id: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {projectOptions.map((option) => (
                        <option key={option.value} value={option.value} disabled={option.disabled}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Hours</label>
                    <input
                      type="text"
                      value={editFormData.hours}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEditFormData({ ...editFormData, hours: e.target.value })}
                      placeholder="H:MM"
                      className="w-32 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={editFormData.notes}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(allocation.id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <p className="font-medium text-gray-900">{allocation.project_name}</p>
                      <span className="text-sm text-gray-500">· {allocation.client_name}</span>
                    </div>
                    <p className="text-sm font-semibold text-blue-600">
                      {formatDurationHHMM(allocation.hours)}
                    </p>
                    {allocation.notes && (
                      <p className="text-sm text-gray-600 mt-1">{allocation.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(allocation)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(allocation.id)}
                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
