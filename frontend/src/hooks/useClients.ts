import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsApi } from '../api/clients'
import type { ClientsResponse, ClientResponse, ClientFormData, ClientUpdateData } from '../types'

export function useClients(includeArchived = false) {
  return useQuery<ClientsResponse>({
    queryKey: ['clients', includeArchived],
    queryFn: () => clientsApi.getAll(includeArchived),
  })
}

export function useClient(id: string | null | undefined) {
  return useQuery<ClientResponse>({
    queryKey: ['clients', id],
    queryFn: () => clientsApi.getById(id!),
    enabled: !!id,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation<ClientResponse, Error, ClientFormData>({
    mutationFn: clientsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation<ClientResponse, Error, { id: string; data: ClientUpdateData }>({
    mutationFn: ({ id, data }) => clientsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useArchiveClient() {
  const queryClient = useQueryClient()

  return useMutation<ClientResponse, Error, string>({
    mutationFn: clientsApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useRestoreClient() {
  const queryClient = useQueryClient()

  return useMutation<ClientResponse, Error, string>({
    mutationFn: clientsApi.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: clientsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}
