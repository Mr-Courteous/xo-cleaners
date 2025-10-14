import React, { useEffect, useState } from 'react';
import { Plus, User } from 'lucide-react';
import { apiCall, useApi } from '../hooks/useApi';
import Modal from './Modal';

interface UserRecord {
  id?: number;
  username: string;
  email?: string;
  role?: string;
  created_at?: string;
}

export default function UsersManagement() {
  const { data, loading, error, refetch } = useApi<UserRecord[]>('/api/users', [] as any[]);
  const users = data || [];

  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', email: '', role: 'user' });
  const [localError, setLocalError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; body: string } | null>(null);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editingPassword, setEditingPassword] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; username?: string } | null>(null);

  useEffect(() => {
    // no-op
  }, []);

  const createUser = async () => {
    setLocalError(null);
    if (!form.username || !form.password) {
      setLocalError('Username and password required');
      return;
    }
    setCreating(true);
    try {
      const created = await apiCall('/api/users', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({ username: '', password: '', email: '', role: 'user' });
      setShowForm(false);
      await refetch();
      alert('User created');
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const deleteUser = async (id?: number, username?: string) => {
    if (!id) return;
    // Open a dedicated confirmation modal (don't reuse the edit modal state)
    setDeleteTarget({ id, username });
    setModalContent({ title: 'Confirm Delete', body: `Are you sure you want to delete user <strong>${username || id}</strong>? This action cannot be undone.` });
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await apiCall(`/users/${deleteTarget.id}`, { method: 'DELETE' });
      setModalOpen(false);
      setDeleteTarget(null);
      await refetch();
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to delete user');
      setModalOpen(false);
      setDeleteTarget(null);
    }
  };

  const startEdit = (u: UserRecord) => {
    // start edit flow (clear any pending delete target)
    setDeleteTarget(null);
    setEditingUser(u);
    setModalContent({ title: `Edit ${u.username}`, body: '' });
    setModalOpen(true);
  };

  const saveEdit = async () => {
    if (!editingUser?.id) return;
    try {
      const payload: any = { username: editingUser.username, email: editingUser.email, role: editingUser.role };
      if (editingPassword) payload.password = editingPassword;
      await apiCall(`/users/${editingUser.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      setModalOpen(false);
      setEditingUser(null);
      await refetch();
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to update user');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-sm text-gray-500">Create and manage users</p>
        </div>
        <div>
          <button onClick={() => setShowForm(s => !s)} className="bg-green-600 text-white px-4 py-2 rounded">
            <Plus className="inline-block mr-2" /> {showForm ? 'Close' : 'New User'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded shadow mb-6">
          {localError && <div className="text-red-600 mb-2">{localError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="p-2 border rounded" />
            <input placeholder="password" value={form.password} type="password" onChange={e => setForm({...form, password: e.target.value})} className="p-2 border rounded" />
            <input placeholder="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="p-2 border rounded" />
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="p-2 border rounded">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="mt-4 flex space-x-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button onClick={createUser} disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded">{creating ? 'Creating...' : 'Create'}</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded shadow">
        <div className="p-4 border-b">
          <strong>Users</strong>
        </div>
        <div>
          {loading && <div className="p-4">Loading...</div>}
          {!loading && users.length === 0 && <div className="p-4 text-gray-500">No users found</div>}
          {!loading && users.map(u => (
            <div key={u.id} className="p-4 flex justify-between border-b items-center">
              <div>
                <div className="font-medium">{u.username}</div>
                <div className="text-sm text-gray-500">{u.email || '—'}</div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-600">{u.role}</div>
                <button onClick={() => startEdit(u)} className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                <button onClick={() => deleteUser(u.id, u.username)} className="text-sm text-red-600 hover:text-red-800">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {modalOpen && modalContent && (
        <Modal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setEditingUser(null); setEditingPassword(''); setDeleteTarget(null); }}
          title={modalContent.title}
          actions={deleteTarget ? (
            <>
              <button onClick={() => { setModalOpen(false); setDeleteTarget(null); }} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
            </>
          ) : editingUser ? (
            <>
              <button onClick={() => { setModalOpen(false); setEditingUser(null); setEditingPassword(''); }} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={saveEdit} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
            </>
          ) : null}
        >
          {deleteTarget ? (
            <div dangerouslySetInnerHTML={{ __html: modalContent.body }} />
          ) : editingUser ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} className="mt-1 p-2 border rounded w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password (leave blank to keep)</label>
                <input type="password" value={editingPassword} onChange={e => setEditingPassword(e.target.value)} className="mt-1 p-2 border rounded w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="mt-1 p-2 border rounded w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})} className="mt-1 p-2 border rounded w-full">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: modalContent.body }} />
          )}
        </Modal>
      )}
    </div>
  );
}
