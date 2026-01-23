import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { DailySummaryItem } from '../../types'

export interface DailySummaryChartProps {
  data: DailySummaryItem[] | null
  date: string
}

export default function DailySummaryChart({ data, date }: DailySummaryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 text-center text-gray-500">
        No data available for {date || 'the selected date'}
      </div>
    )
  }

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

  const projectColors: Record<string, string> = {}
  data.forEach((item, index) => {
    projectColors[item.project_name] = COLORS[index % COLORS.length]
  })

  const chartData = data.map((item) => ({
    project: item.project_name,
    hours: item.hours,
    fill: projectColors[item.project_name],
  }))

  const totalHours = data.reduce((sum, item) => sum + item.hours, 0)

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Hours Worked by Project - {date}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="project" angle={-45} textAnchor="end" height={100} />
            <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="hours" name="Hours" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Hours</h3>
          <p className="text-3xl font-bold text-gray-900">{totalHours.toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Projects Worked On</h3>
          <p className="text-3xl font-bold text-gray-900">{data.length}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Breakdown</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hours
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Percentage
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.project_name}>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: projectColors[item.project_name] }}
                    />
                    {item.project_name}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                  {item.hours.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                  {((item.hours / totalHours) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
