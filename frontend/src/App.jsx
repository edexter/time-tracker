import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-gray-900">
              Time Tracker
            </h1>
            <p className="mt-4 text-gray-600">
              Application is being built. Check back soon!
            </p>
          </div>
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App
