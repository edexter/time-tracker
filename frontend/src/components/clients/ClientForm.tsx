import { useState, FormEvent } from 'react'
import Input from '../shared/Input'
import Select from '../shared/Select'
import Button from '../shared/Button'
import type { Client, ClientFormData, Currency } from '../../types'

export interface ClientFormProps {
  client?: Client | null
  onSubmit: (data: ClientFormData) => void
  onCancel: () => void
  isLoading: boolean
}

interface FormState {
  name: string
  short_name: string
  currency: Currency
  default_hourly_rate: string
  hour_budget: string
}

interface FormErrors {
  name?: string
  default_hourly_rate?: string
  [key: string]: string | undefined
}

export default function ClientForm({ client = null, onSubmit, onCancel, isLoading }: ClientFormProps) {
  const [formData, setFormData] = useState<FormState>({
    name: client?.name || '',
    short_name: client?.short_name || '',
    currency: client?.currency || 'EUR',
    default_hourly_rate: client?.default_hourly_rate?.toString() || '',
    hour_budget: client?.hour_budget?.toString() || '',
  })

  const [errors, setErrors] = useState<FormErrors>({})

  const currencyOptions = [
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'CHF', label: 'CHF (Fr.)' },
  ]

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const newErrors: FormErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.default_hourly_rate) newErrors.default_hourly_rate = 'Hourly rate is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const submitData: ClientFormData = {
      name: formData.name,
      short_name: formData.short_name || undefined,
      currency: formData.currency,
      default_hourly_rate: parseFloat(formData.default_hourly_rate),
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
      <Input
        label="Client Name"
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

      <Select
        label="Currency"
        value={formData.currency}
        onChange={(e) => handleChange('currency', e.target.value as Currency)}
        options={currencyOptions}
        required
      />

      <Input
        label="Default Hourly Rate"
        type="number"
        value={formData.default_hourly_rate}
        onChange={(e) => handleChange('default_hourly_rate', e.target.value)}
        error={errors.default_hourly_rate}
        required
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
          {isLoading ? 'Saving...' : client ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
