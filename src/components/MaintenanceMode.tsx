import React from 'react';

//
const MAINTENANCE_MODE = true; // Set to true to enable

const MaintenanceMode: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!MAINTENANCE_MODE) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-app-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo/Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-accent-primary to-accent-secondary rounded-full flex items-center justify-center shadow-lg">
            <svg 
              className="w-10 h-10 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
          </div>
        </div>

        {/* Main Message */}
        <h1 className="text-3xl font-bold text-text-default mb-4">
          System Maintenance
        </h1>
        
        <p className="text-lg text-text-default mb-6">
          We're currently performing system maintenance to improve your experience.
        </p>
        
        <p className="text-base text-text-subtle mb-8">
          We'll be back soon! Thank you for your patience.
        </p>

        {/* Status Indicator */}
        <div className="flex items-center justify-center space-x-2 text-sm text-text-subtle bg-surface-alt rounded-full px-4 py-2 inline-flex mx-auto">
          <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse"></div>
          <span>Maintenance in progress...</span>
        </div>

        {/* Footer */}
        <div className="mt-12 text-xs text-text-subtle">
          <p>Need urgent support? Contact us at support@riftfi.xyz</p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceMode;