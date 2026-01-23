import { ChangeEvent } from 'react'

export interface NumberStepperProps {
  label?: string
  value: string | number
  onChange: (value: string) => void
  min?: number
  max?: number
  step?: number
  required?: boolean
  error?: string
  className?: string
}

export default function NumberStepper({
  label,
  value,
  onChange,
  min = 0,
  max = 24,
  step = 0.25,
  required = false,
  error = '',
  className = ''
}: NumberStepperProps) {
  const numericValue = parseFloat(String(value) || '0') || 0

  const increment = () => {
    const newValue = numericValue + step
    if (newValue <= max) {
      onChange(newValue.toFixed(2))
    }
  }

  const decrement = () => {
    const newValue = numericValue - step
    if (newValue >= min) {
      onChange(newValue.toFixed(2))
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={decrement}
          disabled={numericValue <= min}
          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded font-bold text-lg"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          step={step}
          min={min}
          max={max}
          required={required}
          className={`w-24 px-3 py-2 border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <button
          type="button"
          onClick={increment}
          disabled={numericValue >= max}
          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded font-bold text-lg"
        >
          +
        </button>
        <span className="text-sm text-gray-600">hours</span>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
