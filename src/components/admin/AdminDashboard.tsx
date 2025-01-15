import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { AdminProfile as AdminProfileType } from '../../types/auth';
import { Spinner } from '../ui/Spinner';

export const AdminDashboard = () => {
  const { profile, isLoading } = useAuthStore();
  const adminProfile = profile as AdminProfileType;
  const [activeTab, setActiveTab] = useState<'users' | 'content' | 'analytics'>('users');

  if (isLoading) {
    return <Spinner />;
  }

  if (!adminProfile || adminProfile.role !== 'admin') {
    return <div>Access denied</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-600">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-amber-100">Manage your WhiskeyWiz instance</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'content'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Content
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'users' && (
            <div>
              <h2 className="text-xl font-bold mb-4">User Management</h2>
              <p className="text-gray-500">User management features coming soon...</p>
            </div>
          )}

          {activeTab === 'content' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Content Management</h2>
              <p className="text-gray-500">Content management features coming soon...</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Game Analytics</h2>
              <p className="text-gray-500">Analytics features coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* Permissions Info */}
      <div className="mt-8 bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Your Admin Permissions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(adminProfile.permissions).map(([key, value]) => (
            <div key={key} className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              <p className={value ? 'text-green-600' : 'text-red-600'}>
                {value ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};