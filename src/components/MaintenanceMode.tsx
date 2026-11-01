import React from 'react';


// Temporary outage screen: while true, this replaces the entire app.
const MAINTENANCE_MODE = true; // Set to false to bring the app back

const SUPPORT_EMAIL = 'amschel@riftfi.com';

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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Main Message */}
        <h1 className="text-3xl font-bold text-text-default mb-4">
          Rift is temporarily down
        </h1>

        <p className="text-lg text-text-default mb-6">
          We're working to restore service as quickly as possible.
        </p>

        <p className="text-base text-text-subtle mb-8">
          For any queries, email{' '}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-accent-primary font-medium underline underline-offset-2"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>

        {/* Status Indicator */}
        <div className="flex items-center justify-center space-x-2 text-sm text-text-subtle bg-surface-alt rounded-full px-4 py-2 inline-flex mx-auto">
          <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse"></div>
          <span>Temporarily unavailable</span>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceMode;
