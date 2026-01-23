import { useState, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
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
import type { Client, ClientFormData } from '../types'

export default function ClientsPage() {
  const navigate = useNavigate()
  const [showArchived, setShowArchived] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Client | null>(null)

  const { data, isLoading } = useClients(showArchived)
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const archiveClient = useArchiveClient()
  const restoreClient = useRestoreClient()
  const deleteClient = useDeleteClient()

  const handleCreate = async (clientData: ClientFormData) => {
    try {
      await createClient.mutateAsync(clientData)
      setIsFormOpen(false)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      alert(err.response?.data?.error || 'Failed to create client')
    }
  }

  const handleUpdate = async (clientData: ClientFormData) => {
    if (!editingClient) return
    try {
      await updateClient.mutateAsync({ id: editingClient.id, data: clientData })
      setEditingClient(null)
      setIsFormOpen(false)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      alert(err.response?.data?.error || 'Failed to update client')
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setIsFormOpen(true)
  }

  const handleArchive = async (id: string) => {
    await archiveClient.mutateAsync(id)
  }

  const handleRestore = async (id: string) => {
    await restoreClient.mutateAsync(id)
  }

  const handleDelete = (client: Client) => {
    setDeleteConfirm(client)
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteClient.mutateAsync(deleteConfirm.id)
      setDeleteConfirm(null)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      alert(err.response?.data?.error || 'Failed to delete client')
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
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <button
        onClick={() => navigate('/')}
        className="text-white hover:text-gray-200 mb-4 flex items-center gap-1"
      >
        ← Back to Time Tracker
      </button>

      <div className="flex justify-between items-center mb-5">
        <h1 className="text-lg font-bold text-white">Clients</h1>
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
          <Button onClick={openNewClientForm}>Add Client</Button>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl shadow-md">
          <p className="text-gray-500">No clients found. Create your first client to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3">
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
