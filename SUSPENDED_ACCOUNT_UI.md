# Handling Suspended Account Response

## API Response

When a suspended user attempts to authenticate by using any endpoint , the API returns:

**HTTP Status:** `403 Forbidden`

```json
{
  "message": "Account suspended",
  "error": "Your account has been suspended and cannot access this service.",
  "suspendedAt": "2025-01-06T12:30:45.000Z",
  "reason": "Multiple failed onramp attempts"
}
```

> **Note:** The `reason` field should NOT be displayed to the user. Only show the generic suspension message.

---

## React UI Example

### SuspendedAccountModal Component

```tsx
import React from 'react';

interface SuspendedAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SuspendedAccountModal: React.FC<SuspendedAccountModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-xl">
        {/* Warning Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Account Suspended
        </h2>

        {/* Message */}
        <p className="text-gray-600 mb-8">
          Your account has been suspended and cannot access this service.
        </p>

        {/* Contact Support Button */}
        <a
          href="mailto:admin@riftfi.xyz"
          className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          Contact Support
        </a>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-4 text-gray-500 hover:text-gray-700 text-sm font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SuspendedAccountModal;
```

---

### API Error Handler Utility

```tsx
// utils/apiErrorHandler.ts

interface ApiError {
  message: string;
  error?: string;
  suspendedAt?: string;
  reason?: string;
}

export const handleApiError = (
  status: number,
  data: ApiError,
  showSuspendedModal: () => void
) => {
  // Check if user is suspended
  if (status === 403 && data.message === 'Account suspended') {
    showSuspendedModal();
    return;
  }

  // Handle other errors...
};
```

---

### Usage in API Call

```tsx
import { useState } from 'react';
import SuspendedAccountModal from './components/SuspendedAccountModal';
import { handleApiError } from './utils/apiErrorHandler';

const MyComponent = () => {
  const [showSuspended, setShowSuspended] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/some-endpoint', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-api-key': apiKey,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        handleApiError(response.status, data, () => setShowSuspended(true));
        return;
      }

      // Handle success...
    } catch (error) {
      console.error('Request failed:', error);
    }
  };

  return (
    <div>
      {/* Your component content */}
      
      <SuspendedAccountModal
        isOpen={showSuspended}
        onClose={() => setShowSuspended(false)}
      />
    </div>
  );
};
```

---

### Axios Interceptor Example

```tsx
// api/axiosInstance.ts
import axios from 'axios';

let showSuspendedModal: (() => void) | null = null;

export const setShowSuspendedModal = (fn: () => void) => {
  showSuspendedModal = fn;
};

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 403 &&
      error.response?.data?.message === 'Account suspended'
    ) {
      // Clear auth tokens
      localStorage.removeItem('token');
      
      // Show suspended modal
      if (showSuspendedModal) {
        showSuspendedModal();
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

---

## Support Email

All suspension inquiries should be directed to:

📧 **admin@riftfi.xyz**

