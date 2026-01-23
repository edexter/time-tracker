import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '../api/projects'
import type { ProjectsResponse, ProjectResponse, ProjectFormData, ProjectUpdateData } from '../types'

export function useProjects(clientId: string | null | undefined = null, includeArchived = false) {
  return useQuery<ProjectsResponse>({
    queryKey: ['projects', clientId, includeArchived],
    queryFn: () => projectsApi.getAll(clientId, includeArchived),
  })
}

export function useProject(id: string | null) {
  return useQuery<ProjectResponse>({
    queryKey: ['projects', id],
    queryFn: () => projectsApi.getById(id!),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation<ProjectResponse, Error, ProjectFormData>({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation<ProjectResponse, Error, { id: string; data: ProjectUpdateData }>({
    mutationFn: ({ id, data }) => projectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useArchiveProject() {
  const queryClient = useQueryClient()

  return useMutation<ProjectResponse, Error, string>({
    mutationFn: projectsApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useRestoreProject() {
  const queryClient = useQueryClient()

  return useMutation<ProjectResponse, Error, string>({
    mutationFn: projectsApi.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: projectsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
