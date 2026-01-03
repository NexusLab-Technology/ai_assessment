'use client';

import { ApplicationShell } from '@/components/ApplicationShell'
import { RouteGuard } from '@/components/RouteGuard'
import { useAuth } from '@/contexts/AuthContext'

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <RouteGuard>
      <ApplicationShell>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Settings
            </h1>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Profile Submenu Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Profile Information
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Username
                      </label>
                      <div className="mt-1 p-3 bg-white rounded-md border border-gray-200">
                        <span className="text-gray-900">
                          {user?.username || 'Not available'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <div className="mt-1 p-3 bg-white rounded-md border border-gray-200">
                        <span className="text-gray-900">
                          {user?.email || 'Not available'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Role
                      </label>
                      <div className="mt-1 p-3 bg-white rounded-md border border-gray-200">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {(user?.roles?.[0] && user.roles[0].trim()) || 'User'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional Settings Sections (Future Implementation) */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Application Settings
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-center py-8">
                    Additional settings will be available in future updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ApplicationShell>
    </RouteGuard>
  )
}