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
}) {
  const increment = () => {
    const newValue = parseFloat(value || 0) + step
    if (newValue <= max) {
      onChange(newValue.toFixed(2))
    }
  }

  const decrement = () => {
    const newValue = parseFloat(value || 0) - step
    if (newValue >= min) {
      onChange(newValue.toFixed(2))
    }
  }

  const handleInputChange = (e) => {
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
          disabled={parseFloat(value || 0) <= min}
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
          disabled={parseFloat(value || 0) >= max}
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
