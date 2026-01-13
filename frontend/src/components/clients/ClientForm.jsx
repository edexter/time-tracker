import { useState } from 'react'
import Input from '../shared/Input'
import Select from '../shared/Select'
import Button from '../shared/Button'

export default function ClientForm({ client = null, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    short_name: client?.short_name || '',
    currency: client?.currency || 'EUR',
    default_hourly_rate: client?.default_hourly_rate || '',
    hour_budget: client?.hour_budget || '',
  })

  const [errors, setErrors] = useState({})

  const currencyOptions = [
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'CHF', label: 'CHF (Fr.)' },
  ]

  const handleSubmit = (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.default_hourly_rate) newErrors.default_hourly_rate = 'Hourly rate is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const submitData = {
      ...formData,
      default_hourly_rate: parseFloat(formData.default_hourly_rate),
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
        maxLength={50}
      />

      <Select
        label="Currency"
        value={formData.currency}
        onChange={(e) => handleChange('currency', e.target.value)}
        options={currencyOptions}
        required
      />

      <Input
        label="Default Hourly Rate"
        type="number"
        value={formData.default_hourly_rate}
        onChange={(e) => handleChange('default_hourly_rate', e.target.value)}
        error={errors.default_hourly_rate}
        step="0.01"
        min="0"
        required
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
          {isLoading ? 'Saving...' : client ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
