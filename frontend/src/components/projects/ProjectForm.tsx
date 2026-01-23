import { useState, FormEvent } from 'react'
import { useClients } from '../../hooks/useClients'
import Input from '../shared/Input'
import Select from '../shared/Select'
import Button from '../shared/Button'
import type { Project, ProjectFormData } from '../../types'

export interface ProjectFormProps {
  project?: Project | null
  clientId?: string | null
  onSubmit: (data: ProjectFormData) => void
  onCancel: () => void
  isLoading: boolean
}

interface FormState {
  client_id: string
  name: string
  short_name: string
  hourly_rate_override: string
  hour_budget: string
}

interface FormErrors {
  client_id?: string
  name?: string
  [key: string]: string | undefined
}

export default function ProjectForm({ project = null, clientId = null, onSubmit, onCancel, isLoading }: ProjectFormProps) {
  const { data: clientsData } = useClients(false)
  const clients = clientsData?.clients || []

  const [formData, setFormData] = useState<FormState>({
    client_id: clientId || project?.client_id || '',
    name: project?.name || '',
    short_name: project?.short_name || '',
    hourly_rate_override: project?.hourly_rate_override?.toString() || '',
    hour_budget: project?.hour_budget?.toString() || '',
  })

  const [errors, setErrors] = useState<FormErrors>({})

  const clientOptions = [
    { value: '', label: '-- Select Client --' },
    ...clients.map((client) => ({
      value: client.id,
      label: `${client.name} (${client.currency})`,
    })),
  ]

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const newErrors: FormErrors = {}
    if (!formData.client_id) newErrors.client_id = 'Client is required'
    if (!formData.name.trim()) newErrors.name = 'Project name is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const submitData: ProjectFormData = {
      client_id: formData.client_id,
      name: formData.name,
      short_name: formData.short_name || undefined,
      hourly_rate_override: formData.hourly_rate_override
        ? parseFloat(formData.hourly_rate_override)
        : null,
      hour_budget: formData.hour_budget ? parseFloat(formData.hour_budget) : null,
    }

    onSubmit(submitData)
  }

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!clientId && (
        <Select
          label="Client"
          value={formData.client_id}
          onChange={(e) => handleChange('client_id', e.target.value)}
          options={clientOptions}
          error={errors.client_id}
          required
        />
      )}

      <Input
        label="Project Name"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        error={errors.name}
        required
      />

      <Input
        label="Short Name (optional)"
        value={formData.short_name}
        onChange={(e) => handleChange('short_name', e.target.value)}
      />

      <Input
        label="Hourly Rate Override (optional)"
        type="number"
        value={formData.hourly_rate_override}
        onChange={(e) => handleChange('hourly_rate_override', e.target.value)}
      />

      <Input
        label="Hour Budget (optional)"
        type="number"
        value={formData.hour_budget}
        onChange={(e) => handleChange('hour_budget', e.target.value)}
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
