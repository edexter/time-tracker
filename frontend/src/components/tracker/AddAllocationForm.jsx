import { useState } from 'react'
import { useProjects } from '../../hooks/useProjects'
import { useCreateAllocation } from '../../hooks/useAllocations'
import Select from '../shared/Select'
import NumberStepper from '../shared/NumberStepper'
import Button from '../shared/Button'

export default function AddAllocationForm({ date, unallocated, onUpdate }) {
  const { data: projectsData } = useProjects(null, false)
  const createAllocation = useCreateAllocation()

  const [formData, setFormData] = useState({
    project_id: '',
    hours: '0.25',
    notes: '',
  })

  const projects = projectsData?.projects || []

  // Group projects by client
  const projectOptions = [
    { value: '', label: '-- Select Project --' },
  ]

  const projectsByClient = projects.reduce((acc, project) => {
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
      const displayName = project.short_name || project.name
      const budgetInfo = project.hour_budget
        ? ` (${project.hours_logged.toFixed(1)}h / ${project.hour_budget}h)`
        : ''
      projectOptions.push({
        value: project.id,
        label: `  ${displayName}${budgetInfo}`
      })
    })
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.project_id) {
      alert('Please select a project')
      return
    }

    const hours = parseFloat(formData.hours)
    if (hours <= 0) {
      alert('Hours must be greater than 0')
      return
    }

    if (hours > unallocated) {
      alert(`Cannot allocate ${hours}h. Only ${unallocated.toFixed(2)}h available.`)
      return
    }

    try {
      await createAllocation.mutateAsync({
        date,
        project_id: formData.project_id,
        hours,
        notes: formData.notes || null
      })

      setFormData({ project_id: '', hours: '0.25', notes: '' })
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create allocation')
    }
  }

  if (unallocated <= 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-green-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium">All time has been allocated</p>
        </div>
      </div>
    )
  }

  const formatTimeInput = (hours) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}:${m.toString().padStart(2, '0')}`
  }

  const parseTimeInput = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number)
    return h + (m / 60)
  }

  const adjustTime = (delta) => {
    const current = parseFloat(formData.hours)
    const newValue = Math.max(0.25, Math.min(unallocated, current + delta))
    setFormData({ ...formData, hours: newValue.toString() })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">Allocate Time</h3>
        <span className="text-sm text-gray-500">
          Available: <span className="font-semibold text-blue-600">{formatTimeInput(unallocated)}</span>
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <select
            value={formData.project_id}
            onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {projectOptions.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={formatTimeInput(parseFloat(formData.hours))}
            readOnly
            className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-center font-mono"
          />
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => adjustTime(0.25)}
              className="px-2 py-0 text-xs bg-gray-200 hover:bg-gray-300 rounded-t transition-colors flex-1"
              title="Add 15 minutes"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => adjustTime(-0.25)}
              className="px-2 py-0 text-xs bg-gray-200 hover:bg-gray-300 rounded-b transition-colors flex-1 border-t border-gray-300"
              title="Subtract 15 minutes"
            >
              −
            </button>
          </div>
        </div>

        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Notes (optional)"
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={createAllocation.isPending}
        >
          {createAllocation.isPending ? 'Adding...' : 'Add'}
        </Button>
      </div>
    </form>
  )
}
