import { useState } from 'react'
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useArchiveClient,
  useRestoreClient,
  useDeleteClient,
} from '../hooks/useClients'
import ClientRow from '../components/clients/ClientRow'
import ClientForm from '../components/clients/ClientForm'
import Modal from '../components/shared/Modal'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import Button from '../components/shared/Button'
import LoadingSpinner from '../components/shared/LoadingSpinner'

export default function ClientsPage() {
  const [showArchived, setShowArchived] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const { data, isLoading } = useClients(showArchived)
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const archiveClient = useArchiveClient()
  const restoreClient = useRestoreClient()
  const deleteClient = useDeleteClient()

  const handleCreate = async (clientData) => {
    try {
      await createClient.mutateAsync(clientData)
      setIsFormOpen(false)
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create client')
    }
  }

  const handleUpdate = async (clientData) => {
    try {
      await updateClient.mutateAsync({ id: editingClient.id, data: clientData })
      setEditingClient(null)
      setIsFormOpen(false)
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update client')
    }
  }

  const handleEdit = (client) => {
    setEditingClient(client)
    setIsFormOpen(true)
  }

  const handleArchive = async (id) => {
    await archiveClient.mutateAsync(id)
  }

  const handleRestore = async (id) => {
    await restoreClient.mutateAsync(id)
  }

  const handleDelete = (client) => {
    setDeleteConfirm(client)
  }

  const confirmDelete = async () => {
    try {
      await deleteClient.mutateAsync(deleteConfirm.id)
      setDeleteConfirm(null)
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete client')
    }
  }

  const openNewClientForm = () => {
    setEditingClient(null)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setEditingClient(null)
    setIsFormOpen(false)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const clients = data?.clients || []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <Button onClick={openNewClientForm}>Add Client</Button>
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-gray-300"
          />
          Show archived clients
        </label>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No clients found. Create your first client to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {clients.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
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
        title={editingClient ? 'Edit Client' : 'New Client'}
      >
        <ClientForm
          client={editingClient}
          onSubmit={editingClient ? handleUpdate : handleCreate}
          onCancel={closeForm}
          isLoading={createClient.isPending || updateClient.isPending}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Client"
        message={`Are you sure you want to permanently delete "${deleteConfirm?.name}"? This cannot be undone.`}
      />
    </div>
  )
}
