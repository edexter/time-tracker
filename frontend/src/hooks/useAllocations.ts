import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { allocationsApi } from '../api/allocations'
import type { AllocationsResponse, AllocationResponse, AllocationFormData, AllocationUpdateData } from '../types'

export function useAllocations(date: string | null) {
  return useQuery<AllocationsResponse>({
    queryKey: ['allocations', date],
    queryFn: () => allocationsApi.getByDate(date!),
    enabled: !!date,
  })
}

export function useCreateAllocation() {
  const queryClient = useQueryClient()

  return useMutation<AllocationResponse, Error, AllocationFormData>({
    mutationFn: allocationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] })
    },
  })
}

export function useUpdateAllocation() {
  const queryClient = useQueryClient()

  return useMutation<AllocationResponse, Error, { id: string; data: AllocationUpdateData }>({
    mutationFn: ({ id, data }) => allocationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] })
    },
  })
}

export function useDeleteAllocation() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: allocationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] })
    },
  })
}
