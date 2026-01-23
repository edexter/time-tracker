import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { DailyHoursItem } from '../../types'

export interface DailyHoursChartProps {
  data: DailyHoursItem[] | null
  startDate: string
  endDate: string
}

interface CustomXAxisTickProps {
  x?: number
  y?: number
  payload?: { value: string }
}

export default function DailyHoursChart({ data, startDate, endDate }: DailyHoursChartProps) {
  const generateDateRange = (start: string, end: string): string[] => {
    const dates: string[] = []
    const current = new Date(start + 'T00:00:00')
    const endDateObj = new Date(end + 'T00:00:00')

    while (current <= endDateObj) {
      const year = current.getFullYear()
      const month = String(current.getMonth() + 1).padStart(2, '0')
      const day = String(current.getDate()).padStart(2, '0')
      dates.push(`${year}-${month}-${day}`)
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  const dates = generateDateRange(startDate, endDate)

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

  const clients = data ? [...new Set(data.map(item => item.client_name))] : []

  const clientColors: Record<string, string> = {}
  clients.forEach((client, index) => {
    clientColors[client] = COLORS[index % COLORS.length]
  })

  const CustomXAxisTick = ({ x, y, payload }: CustomXAxisTickProps) => {
    if (!payload || x === undefined || y === undefined) return null
    const date = new Date(payload.value + 'T00:00:00')
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
    const dateNum = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={12} textAnchor="middle" fill="#666" fontSize={12}>
          {dayName}
        </text>
        <text x={0} y={0} dy={26} textAnchor="middle" fill="#999" fontSize={10}>
          {dateNum}
        </text>
      </g>
    )
  }

  const dailyTotalsData = dates.map(date => {
    const dayEntries = data ? data.filter(item => item.date === date) : []
    const total = dayEntries.reduce((sum, item) => sum + item.hours, 0)
    return { date, total }
  })

  const byClientData = dates.map(date => {
    const dataPoint: Record<string, string | number> = { date }
    clients.forEach(client => {
      const clientHours = data
        ? data.filter(item => item.date === date && item.client_name === client)
            .reduce((sum, item) => sum + item.hours, 0)
        : 0
      dataPoint[client] = clientHours || 0
    })
    return dataPoint
  })

  const formatTooltipDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  const hasData = data && data.length > 0

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Hours</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyTotalsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={<CustomXAxisTick />}
              height={50}
              interval={0}
            />
            <YAxis
              label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
              domain={[0, 'auto']}
            />
            <Tooltip
              labelFormatter={formatTooltipDate}
              formatter={(value) => [(value as number).toFixed(2), 'Hours']}
            />
            <ReferenceLine
              y={7}
              stroke="#9ca3af"
              strokeDasharray="5 5"
              label={{ value: '7h target', position: 'right', fill: '#9ca3af', fontSize: 12 }}
            />
            <Bar dataKey="total" fill="#3b82f6" name="Total Hours" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Hours by Client</h3>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byClientData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={<CustomXAxisTick />}
                height={50}
                interval={0}
              />
              <YAxis
                label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                domain={[0, 'auto']}
              />
              <Tooltip
                labelFormatter={formatTooltipDate}
                formatter={(value) => (value as number).toFixed(2)}
              />
              <Legend />
              {clients.map((client) => (
                <Bar
                  key={client}
                  dataKey={client}
                  stackId="clients"
                  fill={clientColors[client]}
                  name={client}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No client data for this period
          </div>
        )}
      </div>

      {hasData && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary by Client</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {clients.map((client) => {
              const totalHours = data
                .filter(item => item.client_name === client)
                .reduce((sum, item) => sum + item.hours, 0)

              return (
                <div key={client} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: clientColors[client] }}
                    />
                    <span className="font-medium text-gray-900">{client}</span>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">{totalHours.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">Total hours</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                {clients.map(client => (
                  <th key={client} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {client}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {byClientData.map((row) => {
                const dailyTotal = clients.reduce((sum, client) => sum + ((row[client] as number) || 0), 0)
                return (
                  <tr key={row.date as string}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatTooltipDate(row.date as string)}
                    </td>
                    {clients.map(client => (
                      <td key={client} className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                        {row[client] ? (row[client] as number).toFixed(2) : '-'}
                      </td>
                    ))}
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      {dailyTotal > 0 ? dailyTotal.toFixed(2) : '-'}
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
