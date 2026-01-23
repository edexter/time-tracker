import { useState, ChangeEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useClient } from '../hooks/useClients'
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useArchiveProject,
  useRestoreProject,
  useDeleteProject,
} from '../hooks/useProjects'
import ProjectRow from '../components/projects/ProjectRow'
import ProjectForm from '../components/projects/ProjectForm'
import Modal from '../components/shared/Modal'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import Button from '../components/shared/Button'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import type { Project, ProjectFormData } from '../types'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showArchived, setShowArchived] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Project | null>(null)

  const { data: clientData, isLoading: clientLoading } = useClient(id)
  const { data: projectsData, isLoading: projectsLoading } = useProjects(id || null, showArchived)
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const archiveProject = useArchiveProject()
  const restoreProject = useRestoreProject()
  const deleteProject = useDeleteProject()

  const handleCreate = async (projectData: ProjectFormData) => {
    try {
      await createProject.mutateAsync({ ...projectData, client_id: id! })
      setIsFormOpen(false)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      alert(err.response?.data?.error || 'Failed to create project')
    }
  }

  const handleUpdate = async (projectData: ProjectFormData) => {
    if (!editingProject) return
    try {
      await updateProject.mutateAsync({ id: editingProject.id, data: projectData })
      setEditingProject(null)
      setIsFormOpen(false)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      alert(err.response?.data?.error || 'Failed to update project')
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setIsFormOpen(true)
  }

  const handleArchive = async (projectId: string) => {
    await archiveProject.mutateAsync(projectId)
  }

  const handleRestore = async (projectId: string) => {
    await restoreProject.mutateAsync(projectId)
  }

  const handleDelete = (project: Project) => {
    setDeleteConfirm(project)
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteProject.mutateAsync(deleteConfirm.id)
      setDeleteConfirm(null)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      alert(err.response?.data?.error || 'Failed to delete project')
    }
  }

  const openNewProjectForm = () => {
    setEditingProject(null)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setEditingProject(null)
    setIsFormOpen(false)
  }

  if (clientLoading || projectsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const client = clientData?.client
  const projects = projectsData?.projects || []

  if (!client) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-600">Client not found</p>
      </div>
    )
  }

  const budgetPercentage = client.hour_budget
    ? ((client.hours_logged || 0) / client.hour_budget) * 100
    : null

  const getBudgetColor = () => {
    if (!budgetPercentage) return 'bg-gray-200'
    if (budgetPercentage >= 100) return 'bg-red-500'
    if (budgetPercentage >= 80) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}:${m.toString().padStart(2, '0')}`
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <button
        onClick={() => navigate('/clients')}
        className="text-white hover:text-gray-200 mb-4 flex items-center gap-1"
      >
        ← Back to Clients
      </button>

      <div className="bg-white border border-gray-200 rounded-xl shadow-md p-4 mb-5">
        <h1 className="text-lg font-bold text-gray-900 mb-2">{client.name}</h1>
        {client.short_name && (
          <p className="text-base text-gray-500 mb-2">Short name: {client.short_name}</p>
        )}

        {client.hour_budget ? (
          <div className="mt-2">
            <div className="flex justify-between text-base text-gray-600 mb-1">
              <span>Budget</span>
              <span>
                {formatHours(client.hours_logged || 0)} / {formatHours(client.hour_budget)}
                {budgetPercentage && ` (${budgetPercentage.toFixed(0)}%)`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getBudgetColor()} transition-all`}
                style={{ width: `${Math.min(budgetPercentage || 0, 100)}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <p className="text-base text-gray-500">
            {formatHours(client.hours_logged || 0)} logged · No budget set
          </p>
        )}
      </div>

      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-bold text-white">Projects</h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-base text-white">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setShowArchived(e.target.checked)}
              className="rounded border-gray-300"
            />
            Show archived
          </label>
          <Button onClick={openNewProjectForm}>Add Project</Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl shadow-md">
          <p className="text-gray-500">No projects found. Create your first project for this client.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onRestore={handleRestore}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingProject ? 'Edit Project' : 'New Project'}
      >
        <ProjectForm
          project={editingProject}
          clientId={id}
          onSubmit={editingProject ? handleUpdate : handleCreate}
          onCancel={closeForm}
          isLoading={createProject.isPending || updateProject.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Project"
        message={`Are you sure you want to permanently delete "${deleteConfirm?.name}"? This cannot be undone.`}
      />
    </div>
  )
}
