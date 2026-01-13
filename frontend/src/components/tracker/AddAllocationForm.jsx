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
      const budgetInfo = project.hour_budget
        ? ` (${project.hours_logged.toFixed(1)}h / ${project.hour_budget}h)`
        : ''
      projectOptions.push({
        value: project.id,
        label: `  ${project.name}${budgetInfo}`
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
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600">All time has been allocated for this day</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Allocate Time</h3>

      <div className="space-y-4">
        <Select
          label="Project"
          value={formData.project_id}
          onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
          options={projectOptions}
          required
        />

        <NumberStepper
          label="Hours"
          value={formData.hours}
          onChange={(value) => setFormData({ ...formData, hours: value })}
          min={0.25}
          max={unallocated}
          step={0.25}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add notes about this work..."
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={createAllocation.isPending}
        >
          {createAllocation.isPending ? 'Adding...' : 'Add Allocation'}
        </Button>
      </div>
    </form>
  )
}
