import { useState, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useArchiveProject,
  useRestoreProject,
  useDeleteProject,
} from '../hooks/useProjects'
import { useClients } from '../hooks/useClients'
import ProjectRow from '../components/projects/ProjectRow'
import ProjectForm from '../components/projects/ProjectForm'
import Modal from '../components/shared/Modal'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import Button from '../components/shared/Button'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import type { Project, ProjectFormData } from '../types'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [showArchived, setShowArchived] = useState(false)
  const [filterClient, setFilterClient] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Project | null>(null)

  const { data: clientsData } = useClients(false)
  const { data, isLoading } = useProjects(filterClient || null, showArchived)
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const archiveProject = useArchiveProject()
  const restoreProject = useRestoreProject()
  const deleteProject = useDeleteProject()

  const clients = clientsData?.clients || []
  const clientOptions = [
    { value: '', label: 'All Clients' },
    ...clients.map((client) => ({ value: client.id, label: client.name })),
  ]

  const handleCreate = async (projectData: ProjectFormData) => {
    try {
      await createProject.mutateAsync(projectData)
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

  const handleArchive = async (id: string) => {
    await archiveProject.mutateAsync(id)
  }

  const handleRestore = async (id: string) => {
    await restoreProject.mutateAsync(id)
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const projects = data?.projects || []

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <button
        onClick={() => navigate('/')}
        className="text-white hover:text-gray-200 mb-4 flex items-center gap-1"
      >
        ← Back to Time Tracker
      </button>

      <div className="flex justify-between items-center mb-5">
        <h1 className="text-lg font-bold text-white">Projects</h1>
        <div className="flex items-center gap-4">
          <div className="w-64">
            <select
              value={filterClient}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterClient(e.target.value)}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {clientOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

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
          <p className="text-gray-500">
            {clients.length === 0
              ? 'Create a client first before adding projects.'
              : 'No projects found. Create your first project to get started.'}
          </p>
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
