import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface ApiToken {
  id: string;
  name: string;
  description?: string;
  token: string;
  permissions: string[];
  expiresAt?: string;
  lastUsedAt?: string;
  isActive: boolean;
  createdAt: string;
}

const ApiTokens: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<ApiToken | null>(null);
  const [showToken, setShowToken] = useState<{ [key: string]: boolean }>({});
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: tokens, isLoading } = useQuery<ApiToken[]>({
    queryKey: ['api-tokens'],
    queryFn: apiService.getApiTokens,
    retry: 3,
    retryDelay: 1000,
  });

  const createTokenMutation = useMutation({
    mutationFn: apiService.createApiToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
      setShowCreateModal(false);
    },
  });

  const updateTokenMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiService.updateApiToken(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
      setShowEditModal(false);
    },
  });

  const deleteTokenMutation = useMutation({
    mutationFn: apiService.deleteApiToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
      setShowDeleteModal(false);
    },
  });

  const revokeTokenMutation = useMutation({
    mutationFn: apiService.revokeApiToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
    },
  });

  const handleCreateToken = (data: any) => {
    createTokenMutation.mutate(data);
  };

  const handleUpdateToken = (id: string, data: any) => {
    updateTokenMutation.mutate({ id, data });
  };

  const handleDeleteToken = (id: string) => {
    deleteTokenMutation.mutate(id);
  };

  const handleRevokeToken = (id: string) => {
    revokeTokenMutation.mutate(id);
  };

  const toggleTokenVisibility = (tokenId: string) => {
    setShowToken(prev => ({
      ...prev,
      [tokenId]: !prev[tokenId],
    }));
  };

  const copyToClipboard = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (err) {
      console.error('Failed to copy token:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Tokens</h1>
          <p className="text-gray-600 mt-2">Manage your API access tokens for programmatic access</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Token
        </button>
      </div>

      {/* Tokens List */}
      <div className="space-y-4">
        {tokens && tokens.length > 0 ? (
          tokens.map((token) => (
            <div key={token.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{token.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        token.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {token.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {isExpired(token.expiresAt) && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Expired
                      </span>
                    )}
                  </div>
                  
                  {token.description && (
                    <p className="text-sm text-gray-600 mb-2">{token.description}</p>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Created: {formatDate(token.createdAt)}</span>
                    {token.lastUsedAt && (
                      <span>Last used: {formatDate(token.lastUsedAt)}</span>
                    )}
                    {token.expiresAt && (
                      <span>Expires: {formatDate(token.expiresAt)}</span>
                    )}
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Token
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 px-3 py-2 bg-gray-100 rounded-md font-mono text-sm">
                        {showToken[token.id] ? token.token : '••••••••••••••••••••••••••••••••'}
                      </div>
                      <button
                        onClick={() => toggleTokenVisibility(token.id)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        {showToken[token.id] ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(token.token)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        {copiedToken === token.token ? (
                          <CheckIcon className="w-5 h-5 text-green-500" />
                        ) : (
                          <ClipboardDocumentIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Permissions
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {token.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-6">
                  <button
                    onClick={() => {
                      setSelectedToken(token);
                      setShowEditModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="Edit token"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleRevokeToken(token.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                    title="Revoke token"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">🔑</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No API Tokens</h2>
            <p className="text-gray-600 mb-6">Create your first API token to start using the API</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Create Your First Token
            </button>
          </div>
        )}
      </div>

      {/* Create Token Modal */}
      {showCreateModal && (
        <CreateTokenModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateToken}
          isLoading={createTokenMutation.isPending}
        />
      )}

      {/* Edit Token Modal */}
      {showEditModal && selectedToken && (
        <EditTokenModal
          token={selectedToken}
          onClose={() => {
            setShowEditModal(false);
            setSelectedToken(null);
          }}
          onSubmit={(data) => handleUpdateToken(selectedToken.id, data)}
          isLoading={updateTokenMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedToken && (
        <DeleteTokenModal
          token={selectedToken}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedToken(null);
          }}
          onConfirm={() => handleDeleteToken(selectedToken.id)}
          isLoading={deleteTokenMutation.isPending}
        />
      )}
    </div>
  );
};

// Create Token Modal Component
interface CreateTokenModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

const CreateTokenModal: React.FC<CreateTokenModalProps> = ({ onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    expiresIn: '30', // days
  });

  const availablePermissions = [
    'cameras:read',
    'cameras:write',
    'recordings:read',
    'recordings:write',
    'streaming:read',
    'streaming:write',
    'analytics:read',
    'settings:read',
    'settings:write',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permission],
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== permission),
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create API Token</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expires In (Days)
            </label>
            <select
              value={formData.expiresIn}
              onChange={(e) => setFormData(prev => ({ ...prev, expiresIn: e.target.value }))}
              className="input"
            >
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
              <option value="never">Never</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availablePermissions.map((permission) => (
                <label key={permission} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission)}
                    onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{permission}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || formData.permissions.length === 0}
              className="btn btn-primary"
            >
              {isLoading ? 'Creating...' : 'Create Token'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Token Modal Component
interface EditTokenModalProps {
  token: ApiToken;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

const EditTokenModal: React.FC<EditTokenModalProps> = ({ token, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: token.name,
    description: token.description || '',
    permissions: token.permissions,
  });

  const availablePermissions = [
    'cameras:read',
    'cameras:write',
    'recordings:read',
    'recordings:write',
    'streaming:read',
    'streaming:write',
    'analytics:read',
    'settings:read',
    'settings:write',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permission],
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== permission),
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Edit API Token</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availablePermissions.map((permission) => (
                <label key={permission} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission)}
                    onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{permission}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || formData.permissions.length === 0}
              className="btn btn-primary"
            >
              {isLoading ? 'Updating...' : 'Update Token'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Token Modal Component
interface DeleteTokenModalProps {
  token: ApiToken;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const DeleteTokenModal: React.FC<DeleteTokenModalProps> = ({ token, onClose, onConfirm, isLoading }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Delete API Token</h2>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete the token <strong>"{token.name}"</strong>? 
          This action cannot be undone and will immediately revoke access for this token.
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="btn btn-danger"
          >
            {isLoading ? 'Deleting...' : 'Delete Token'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiTokens;
