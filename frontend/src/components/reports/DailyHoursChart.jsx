import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function DailyHoursChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 text-center text-gray-500">
        No data available for the selected date range
      </div>
    )
  }

  // Define consistent colors for projects
  const COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ]

  // Extract unique projects
  const projects = [...new Set(data.map(item => item.project_name))]

  // Assign colors to projects
  const projectColors = {}
  projects.forEach((project, index) => {
    projectColors[project] = COLORS[index % COLORS.length]
  })

  // Extract unique dates
  const dates = [...new Set(data.map(item => item.date))].sort()

  // Transform data: each date becomes a data point with hours for each project
  const chartData = dates.map(date => {
    const dataPoint = { date }

    // For each project, find hours for this date (or 0 if no data)
    projects.forEach(project => {
      const entry = data.find(item => item.date === date && item.project_name === project)
      dataPoint[project] = entry ? entry.hours : 0
    })

    return dataPoint
  })

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Line Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Hours by Project</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              labelFormatter={formatDate}
              formatter={(value) => value.toFixed(2)}
            />
            <Legend />
            {projects.map((project) => (
              <Line
                key={project}
                type="monotone"
                dataKey={project}
                name={project}
                stroke={projectColors[project]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Statistics */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map((project) => {
            const totalHours = data
              .filter(item => item.project_name === project)
              .reduce((sum, item) => sum + item.hours, 0)

            return (
              <div key={project} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: projectColors[project] }}
                  />
                  <span className="font-medium text-gray-900">{project}</span>
                </div>
                <p className="text-2xl font-semibold text-gray-900">{totalHours.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Total hours</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                {projects.map(project => (
                  <th key={project} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {project}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chartData.map((row) => {
                const dailyTotal = projects.reduce((sum, project) => sum + (row[project] || 0), 0)
                return (
                  <tr key={row.date}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDate(row.date)}
                    </td>
                    {projects.map(project => (
                      <td key={project} className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                        {row[project] ? row[project].toFixed(2) : '-'}
                      </td>
                    ))}
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      {dailyTotal.toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
