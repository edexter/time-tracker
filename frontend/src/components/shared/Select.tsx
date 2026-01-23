import { ChangeEventHandler } from 'react'
import type { SelectOption } from '../../types'

export interface SelectProps {
  label?: string
  value: string | number
  onChange: ChangeEventHandler<HTMLSelectElement>
  options: SelectOption[]
  required?: boolean
  error?: string
  className?: string
}

export default function Select({
  label,
  value,
  onChange,
  options,
  required = false,
  error = '',
  className = ''
}: SelectProps) {
  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
