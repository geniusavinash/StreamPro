import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useErrorHandler = () => {
  const { logout } = useAuth();

  const handleError = useCallback((error: any, context?: string) => {
    console.error(`Error in ${context || 'unknown context'}:`, error);

    // Handle different types of errors
    if (error?.response?.status === 401) {
      // Unauthorized - redirect to login
      logout();
      return 'Session expired. Please log in again.';
    }

    if (error?.response?.status === 403) {
      // Forbidden
      return 'You do not have permission to perform this action.';
    }

    if (error?.response?.status === 404) {
      // Not found
      return 'The requested resource was not found.';
    }

    if (error?.response?.status >= 500) {
      // Server error
      return 'Server error. Please try again later.';
    }

    if (error?.code === 'NETWORK_ERROR' || !error?.response) {
      // Network error
      return 'Network error. Please check your connection.';
    }

    // Return the error message from the server or a generic message
    return error?.message || error?.response?.data?.message || 'An unexpected error occurred.';
  }, [logout]);

  return { handleError };
};
