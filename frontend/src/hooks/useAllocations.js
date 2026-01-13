import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { allocationsApi } from '../api/allocations'

export function useAllocations(date) {
  return useQuery({
    queryKey: ['allocations', date],
    queryFn: () => allocationsApi.getByDate(date),
    enabled: !!date,
  })
}

export function useCreateAllocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: allocationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] })
    },
  })
}

export function useUpdateAllocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => allocationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] })
    },
  })
}

export function useDeleteAllocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: allocationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] })
    },
  })
}
