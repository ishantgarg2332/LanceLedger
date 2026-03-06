"use client";

import { useState } from 'react';
import { useDataStore } from '@/hooks/useDataStore';
import Modal from '@/components/Modal';
import { Plus, Search, Building2, User, Users, Mail, Phone, MapPin, MoreVertical, Edit, Trash2 } from 'lucide-react';

const Input = ({ label, icon: Icon, type = "text", ...props }) => (
  <div className="flex flex-col gap-1.5 mb-4">
    <label className="text-sm font-medium text-foreground/80">{label}</label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40">
        <Icon className="w-4 h-4" />
      </div>
      <input
        type={type}
        className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50"
        {...props}
      />
    </div>
  </div>
);

export default function ClientsPage() {
  const { data: clients, add, update, remove, isLoaded } = useDataStore('clients', []);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '', email: '', company: '', phone: '', address: ''
  });

  if (!isLoaded) return <div className="flex items-center justify-center h-full">Loading...</div>;

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingClient(null);
    setFormData({ name: '', email: '', company: '', phone: '', address: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setFormData({ ...client });
    setIsModalOpen(true);
  };

  const openDeleteModal = (client) => {
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingClient) {
      update(editingClient.id, formData);
    } else {
      add(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (clientToDelete) {
      remove(clientToDelete.id);
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-foreground/60 mt-1">Manage your clients and their contact information.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors shadow-lg shadow-primary/25"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              type="text"
              placeholder="Search clients by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="text-sm text-foreground/50">
            {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-foreground/50 uppercase bg-card/50">
              <tr>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Added</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-foreground/50">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Users className="w-8 h-8 opacity-50" />
                      <p>No clients found.</p>
                      {searchTerm && <p className="text-xs">Try adjusting your search.</p>}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="border-b border-border/50 hover:bg-card/30 transition-colors last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {client.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{client.name}</span>
                          <span className="text-xs text-foreground/60 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" />
                            {client.company || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-foreground/80 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-foreground/40" />
                          <a href={`mailto:${client.email}`} className="hover:text-primary transition-colors">{client.email}</a>
                        </span>
                        {client.phone && (
                          <span className="text-foreground/60 flex items-center gap-1.5 text-xs">
                           <Phone className="w-3.5 h-3.5 text-foreground/40" />
                           {client.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground/60">
                      {new Date(client.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(client)}
                          className="p-2 text-foreground/50 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(client)}
                          className="p-2 text-foreground/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Edit Client' : 'Add New Client'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col">
          <Input
            label="Full Name"
            icon={User}
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            required
            placeholder="Jane Doe"
          />
          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            required
            placeholder="jane@company.com"
          />
          <Input
            label="Company Name"
            icon={Building2}
            value={formData.company}
            onChange={e => setFormData({...formData, company: e.target.value})}
            placeholder="Acme Corp"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              icon={Phone}
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              placeholder="+1 (555) 000-0000"
            />
            <Input
              label="Address"
              icon={MapPin}
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              placeholder="123 Web St, City"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border/50">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors text-foreground/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
            >
              {editingClient ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Client"
      >
        <div className="flex flex-col">
          <p className="text-foreground/80 mb-6">
            Are you sure you want to delete <span className="font-semibold text-foreground">{clientToDelete?.name}</span>?
            This action cannot be undone and may affect associated invoices.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors text-foreground/80"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors"
            >
              Delete Client
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
