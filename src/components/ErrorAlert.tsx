import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string | null;
  onClose?: () => void;
  variant?: 'inline' | 'modal' | 'banner';
}

/**
 * Unified error display component for all frontend errors
 * Can be used as inline alert, banner, or modal
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  onClose,
  variant = 'inline'
}) => {
  if (!message) return null;

  if (variant === 'banner') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-50 border-b border-red-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-start gap-3 sm:items-center">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1">
            <h3 className="font-bold text-red-800 text-sm sm:text-base">Error</h3>
            <p className="text-red-700 text-xs sm:text-sm mt-1">{message}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-red-600 hover:text-red-800 flex-shrink-0"
              aria-label="Close error"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-800 text-lg">An Error Occurred</h3>
                <p className="text-red-700 text-sm mt-2">{message}</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-full mt-6 px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 font-medium transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default inline variant
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4">
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-red-800 text-sm font-medium">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-red-600 hover:text-red-800 flex-shrink-0"
          aria-label="Close error"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

/**
 * Parse API errors into user-friendly messages
 */
export const parseApiError = (error: any): string => {
  if (!error) return 'An unknown error occurred';

  // Axios error response
  const resp = error.response?.data;
  if (resp) {
    // FastAPI detail field (string)
    if (typeof resp.detail === 'string') {
      return resp.detail;
    }

    // FastAPI detail field (array of validation errors)
    if (Array.isArray(resp.detail) && resp.detail.length > 0) {
      const messages = resp.detail
        .map((err: any) => err.msg || err.message || JSON.stringify(err))
        .filter(Boolean);
      if (messages.length > 0) {
        return messages[0];
      }
    }

    // Other common error response formats
    if (typeof resp.message === 'string') return resp.message;
    if (typeof resp.error === 'string') return resp.error;
    if (typeof resp === 'string') return resp;
  }

  // Axios error message
  if (error.message) {
    // Skip generic messages
    if (error.message !== 'Network Error') {
      return error.message;
    }
  }

  // Network/connection errors
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please check your connection and try again.';
  }

  if (!navigator.onLine) {
    return 'No internet connection. Please check your network.';
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Success message component (complementary to ErrorAlert)
 */
interface SuccessAlertProps {
  message: string | null;
  onClose?: () => void;
}

export const SuccessAlert: React.FC<SuccessAlertProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 mb-4">
      <div className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5">✓</div>
      <div className="flex-1">
        <p className="text-green-800 text-sm font-medium">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-green-600 hover:text-green-800 flex-shrink-0"
          aria-label="Close message"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
