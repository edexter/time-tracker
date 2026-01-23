import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsApi } from '../api/sessions'
import type { SessionsResponse, SessionResponse, SessionFormData, SessionUpdateData } from '../types'

export function useSessions(date: string | null) {
  return useQuery<SessionsResponse>({
    queryKey: ['sessions', date],
    queryFn: () => sessionsApi.getByDate(date!),
    enabled: !!date,
  })
}

export function useClockIn() {
  const queryClient = useQueryClient()

  return useMutation<SessionResponse, Error, string | null>({
    mutationFn: sessionsApi.clockIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useClockOut() {
  const queryClient = useQueryClient()

  return useMutation<SessionResponse, Error, string | null>({
    mutationFn: sessionsApi.clockOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()

  return useMutation<SessionResponse, Error, SessionFormData>({
    mutationFn: sessionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useUpdateSession() {
  const queryClient = useQueryClient()

  return useMutation<SessionResponse, Error, { id: string; data: SessionUpdateData }>({
    mutationFn: ({ id, data }) => sessionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: sessionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
