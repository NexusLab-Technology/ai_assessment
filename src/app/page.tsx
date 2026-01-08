'use client';

import { ApplicationShell } from '@/components/ApplicationShell'
import { RouteGuard } from '@/components/RouteGuard'
import { useAuth } from '@/contexts/AuthContext'
import { ConfigManager } from '@/lib/config'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  
  // Get authentication configuration with error handling
  let config;
  try {
    config = ConfigManager.getAuthConfig();
  } catch (error) {
    console.error('ConfigManager error in Home page, using default configuration:', error);
    // Fallback to default configuration
    config = {
      authEnabled: true,
      sessionTimeout: 3600000,
      rememberSidebar: true,
      defaultRoute: '/',
    };
  }
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const stats = [
    {
      name: 'Authentication Status',
      value: isAuthenticated ? 'Active' : 'Inactive',
      icon: '🔐',
      color: isAuthenticated ? 'text-green-600' : 'text-red-600',
      bgColor: isAuthenticated ? 'bg-green-50' : 'bg-red-50'
    },
    {
      name: 'Session Timeout',
      value: `${config.sessionTimeout / 60000} min`,
      icon: '⏱️',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'User Role',
      value: user?.roles[0] || 'Guest',
      icon: '👤',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      name: 'Framework Mode',
      value: config.authEnabled ? 'Enabled' : 'Disabled',
      icon: '⚙️',
      color: config.authEnabled ? 'text-indigo-600' : 'text-gray-600',
      bgColor: config.authEnabled ? 'bg-indigo-50' : 'bg-gray-50'
    }
  ];

  const quickActions = [
    {
      name: 'View Profile',
      description: 'Manage your user profile and settings',
      href: '/profile',
      icon: '👤',
      color: 'bg-blue-500'
    },
    {
      name: 'AI Assessment',
      description: 'Create and manage AI-powered assessments',
      href: '/ai-assessment',
      icon: '📊',
      color: 'bg-purple-500'
    },
    {
      name: 'Company Settings',
      description: 'Manage companies and organizations',
      href: '/company-settings',
      icon: '🏢',
      color: 'bg-indigo-500'
    }
  ];

  const recentActivity = [
    {
      action: 'User logged in',
      time: user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A',
      icon: '🔑'
    },
    {
      action: 'Accessed dashboard',
      time: currentTime.toLocaleString(),
      icon: '📊'
    },
    {
      action: 'Session active',
      time: 'Now',
      icon: '✅'
    }
  ];

  return (
    <RouteGuard>
      <ApplicationShell>
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-md p-6 mb-8 text-white">
            <h1 className="text-3xl font-bold mb-2">
              🏠 Welcome Home, {user?.username || 'User'}! 👋
            </h1>
            <p className="text-blue-100">
              This is your home dashboard for the Configurable Authentication Framework. 
              Navigate to your Profile or explore the authentication features.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div key={stat.name} className={`${stat.bgColor} rounded-lg p-6`}>
                <div className="flex items-center">
                  <div className="text-2xl mr-3">{stat.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.name}
                    href={action.href}
                    className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className={`${action.color} text-white p-2 rounded-md mr-4`}>
                      <span className="text-lg">{action.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{action.name}</h3>
                      <p className="text-sm text-gray-500">{action.description}</p>
                    </div>
                    <div className="ml-auto">
                      <span className="text-gray-400">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Recent Activity
              </h2>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center">
                    <div className="text-lg mr-3">{activity.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Framework Information */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Framework Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Authentication</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                      {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Framework:</span>
                    <span className={config.authEnabled ? 'text-green-600' : 'text-gray-600'}>
                      {config.authEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Session:</span>
                    <span className="text-blue-600">Active</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Configuration</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Timeout:</span>
                    <span>{config.sessionTimeout / 60000}min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remember Sidebar:</span>
                    <span>{config.rememberSidebar ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Default Route:</span>
                    <span>{config.defaultRoute}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Environment:</span>
                    <span>{process.env.NODE_ENV}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Features</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Route Protection</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Session Management</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Responsive Sidebar</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>SSR Support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Testing Section */}
          <div className="mt-8 bg-yellow-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-900 mb-4">
              🧪 Test the Framework
            </h2>
            <p className="text-yellow-800 mb-4">
              Try these actions to test different aspects of the authentication framework:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/profile"
                className="bg-yellow-100 hover:bg-yellow-200 p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">👤</div>
                <div className="font-medium text-yellow-900">View Profile</div>
              </Link>
              <button
                onClick={() => {
                  // Toggle sidebar (this would need to be implemented)
                  console.log('Toggle sidebar');
                }}
                className="bg-yellow-100 hover:bg-yellow-200 p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">📱</div>
                <div className="font-medium text-yellow-900">Toggle Sidebar</div>
              </button>
            </div>
          </div>
        </div>
      </ApplicationShell>
    </RouteGuard>
  )
}