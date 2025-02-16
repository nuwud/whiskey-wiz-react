import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { AdminProfile as AdminProfileType } from '../../types/auth.types';
import { Spinner } from '../ui/spinner-ui.component';
import { AdminMetricsPanel } from './admin-metrics-panel.component';
import UserManagement from './user-management.component';
import QuarterAnalytics from './quarter-analytics.component';
import QuarterManagement from './quarter-management.component';
import { QuarterProvider } from '../../contexts/quarter.context';
import { useNavigate } from 'react-router-dom';
import ErrorDisplay from '../ui/error-display.component';
import UnauthorizedAccess from '../ui/unauthorized-access.component';

const AdminDashboard = () => {
  const { profile, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Validate admin profile
  useEffect(() => {
    if (!isLoading && (!profile || profile.role !== 'admin')) {
      setError('Unauthorized access');
      navigate('/');
    }
  }, [profile, isLoading, navigate]);

  // Safe type casting after validation
  const adminProfile = profile?.role === 'admin' ? (profile as AdminProfileType) : null;

  const [activeTab, setActiveTab] = useState<'users' | 'content' | 'analytics' | 'quarter-management'>('users');

  if (isLoading) return <Spinner />;
  if (error) return <ErrorDisplay message={error} />;
  if (!adminProfile) return <UnauthorizedAccess />;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'content':
        return <AdminMetricsPanel />;
      case 'analytics':
        return <QuarterAnalytics />;
      case 'quarter-management':
        return <QuarterManagement />;
      default:
        return null;
    }
  };

  return (
    <QuarterProvider>
      <div className="max-w-7xl mx-auto">
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
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('content')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'content'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Content
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'analytics'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab('quarter-management')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'quarter-management'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Quarter Management
                </button>
              </nav>
                {/* Tab Content */}
                <div className="p-6">
                  {renderTabContent()}
                </div>
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

          {/* Footer */}
          <div className="bg-white shadow-lg rounded-lg p-6 text-center">
            <p>© 2025 WhiskeyWiz. All rights reserved.</p>
            <p>
              <a href="mailto:nuwudorder@gmail.com" className="text-amber-600 hover:text-amber-500">
                Contact Support
              </a>
            </p>
            <p>
              <a href="https://github.com/nuwud/whiskey-wiz-react" className="text-amber-600 hover:text-amber-500">
                View on GitHub
              </a>
            </p>
          </div>
          {/* End of AdminDashboard */}
        </div>
      </div>
    </QuarterProvider>
  );
};

export default AdminDashboard;