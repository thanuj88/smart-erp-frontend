import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * FeatureGuard component - Protects routes/content based on feature and role availability
 * 
 * @param {string} feature - The feature code required
 * @param {string|string[]} role - The role(s) required
 * @param {ReactNode} children - Content to render if access is granted
 * @param {ReactNode} fallback - Optional fallback component to render if access is denied
 */
const FeatureGuard = ({ feature, role, children, fallback = null }) => {
  const { hasFeature, hasRole, user } = useAuth();

  // Check feature availability
  const featureAvailable = feature ? hasFeature(feature) : true;
  
  // Check role
  const roleAllowed = role ? hasRole(role) : true;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to continue.</p>
        </div>
      </div>
    );
  }

  if (!featureAvailable) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Feature Not Available</h1>
            <p className="text-gray-600 mb-6">
              This feature is not included in your current plan ({user?.planType}).
            </p>
            <button
              onClick={() => window.location.href = '/pricing'}
              className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      )
    );
  }

  if (!roleAllowed) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">
              You do not have the required permissions to access this resource.
              Your role: <strong>{user?.role}</strong>
            </p>
          </div>
        </div>
      )
    );
  }

  return children;
};

export default FeatureGuard;
