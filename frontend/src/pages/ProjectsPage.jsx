import { useState } from 'react'
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
import Select from '../components/shared/Select'

export default function ProjectsPage() {
  const [showArchived, setShowArchived] = useState(false)
  const [filterClient, setFilterClient] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

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

  const handleCreate = async (projectData) => {
    try {
      await createProject.mutateAsync(projectData)
      setIsFormOpen(false)
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create project')
    }
  }

  const handleUpdate = async (projectData) => {
    try {
      await updateProject.mutateAsync({ id: editingProject.id, data: projectData })
      setEditingProject(null)
      setIsFormOpen(false)
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update project')
    }
  }

  const handleEdit = (project) => {
    setEditingProject(project)
    setIsFormOpen(true)
  }

  const handleArchive = async (id) => {
    await archiveProject.mutateAsync(id)
  }

  const handleRestore = async (id) => {
    await restoreProject.mutateAsync(id)
  }

  const handleDelete = (project) => {
    setDeleteConfirm(project)
  }

  const confirmDelete = async () => {
    try {
      await deleteProject.mutateAsync(deleteConfirm.id)
      setDeleteConfirm(null)
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete project')
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <Button onClick={openNewProjectForm}>Add Project</Button>
      </div>

      <div className="mb-4 flex gap-4 items-end">
        <div className="w-64">
          <Select
            label="Filter by Client"
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            options={clientOptions}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-gray-300"
          />
          Show archived projects
        </label>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            {clients.length === 0
              ? 'Create a client first before adding projects.'
              : 'No projects found. Create your first project to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
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

      {/* Create/Edit Modal */}
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

      {/* Delete Confirmation */}
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
