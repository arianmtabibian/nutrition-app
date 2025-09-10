/**
 * Utility functions for checking server health and connectivity
 */

import { api } from '../services/api';

/**
 * Check if the server is accessible and responsive
 */
export const checkServerHealth = async (): Promise<{ isHealthy: boolean; message: string; responseTime?: number }> => {
  try {
    const startTime = Date.now();
    
    const response = await api.get('/api/auth/health', { 
      timeout: 5000 // 5 second timeout for health check
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.status === 200) {
      return {
        isHealthy: true,
        message: 'Server is healthy and responsive',
        responseTime
      };
    } else {
      return {
        isHealthy: false,
        message: `Server returned status ${response.status}`,
        responseTime
      };
    }
  } catch (error: any) {
    console.error('Health check failed:', error);
    
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        isHealthy: false,
        message: 'Server is not responding (timeout)'
      };
    } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return {
        isHealthy: false,
        message: 'Cannot connect to server (network error)'
      };
    } else if (error.response?.status === 404) {
      return {
        isHealthy: false,
        message: 'Server is running but health endpoint not found'
      };
    } else {
      return {
        isHealthy: false,
        message: `Server error: ${error.message}`
      };
    }
  }
};

/**
 * Test registration endpoint accessibility
 */
export const testRegistrationEndpoint = async (): Promise<{ isAccessible: boolean; message: string }> => {
  try {
    // Try to make a request to the registration endpoint with invalid data
    // This should return a 400 error, which means the endpoint is accessible
    const response = await api.post('/api/auth/register', {
      // Invalid data to trigger 400 error
    }, {
      timeout: 5000
    });
    
    // If we get here, something unexpected happened
    return {
      isAccessible: true,
      message: 'Registration endpoint is accessible (unexpected response)'
    };
  } catch (error: any) {
    if (error.response?.status === 400) {
      // This is expected - endpoint is accessible but data is invalid
      return {
        isAccessible: true,
        message: 'Registration endpoint is accessible'
      };
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        isAccessible: false,
        message: 'Registration endpoint is not responding (timeout)'
      };
    } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return {
        isAccessible: false,
        message: 'Cannot connect to registration endpoint (network error)'
      };
    } else {
      return {
        isAccessible: false,
        message: `Registration endpoint error: ${error.message}`
      };
    }
  }
};
