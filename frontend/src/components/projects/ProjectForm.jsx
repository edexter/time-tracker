import { useState } from 'react'
import { useClients } from '../../hooks/useClients'
import Input from '../shared/Input'
import Select from '../shared/Select'
import Button from '../shared/Button'

export default function ProjectForm({ project = null, onSubmit, onCancel, isLoading }) {
  const { data: clientsData } = useClients(false)
  const clients = clientsData?.clients || []

  const [formData, setFormData] = useState({
    client_id: project?.client_id || '',
    name: project?.name || '',
    hourly_rate_override: project?.hourly_rate_override || '',
    hour_budget: project?.hour_budget || '',
  })

  const [errors, setErrors] = useState({})

  const clientOptions = [
    { value: '', label: '-- Select Client --' },
    ...clients.map((client) => ({
      value: client.id,
      label: `${client.name} (${client.currency})`,
    })),
  ]

  const handleSubmit = (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!formData.client_id) newErrors.client_id = 'Client is required'
    if (!formData.name.trim()) newErrors.name = 'Project name is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const submitData = {
      ...formData,
      hourly_rate_override: formData.hourly_rate_override
        ? parseFloat(formData.hourly_rate_override)
        : null,
      hour_budget: formData.hour_budget ? parseFloat(formData.hour_budget) : null,
    }

    onSubmit(submitData)
  }

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Client"
        value={formData.client_id}
        onChange={(e) => handleChange('client_id', e.target.value)}
        options={clientOptions}
        error={errors.client_id}
        required
      />

      <Input
        label="Project Name"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        error={errors.name}
        required
      />

      <Input
        label="Hourly Rate Override (optional)"
        type="number"
        value={formData.hourly_rate_override}
        onChange={(e) => handleChange('hourly_rate_override', e.target.value)}
        step="0.01"
        min="0"
      />

      <Input
        label="Hour Budget (optional)"
        type="number"
        value={formData.hour_budget}
        onChange={(e) => handleChange('hour_budget', e.target.value)}
        step="0.25"
        min="0"
      />

      <div className="flex gap-3 justify-end pt-4">
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : project ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
