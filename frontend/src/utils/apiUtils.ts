/**
 * Utility functions for API calls with CSRF token support and auth handling
 */

import { handleTokenExpiry, checkTokenValidity } from './authUtils';

export interface FrappeAPIRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
}

/**
 * Handle authentication errors in API responses
 */
const handleAuthError = async (response: Response) => {
  if (response.status === 401 || response.status === 403) {
    console.warn('Authentication error detected in API response');
    
    // Double-check token validity
    const tokenInfo = await checkTokenValidity();
    if (!tokenInfo.isValid) {
      handleTokenExpiry();
      return;
    }
  }
};

/**
 * Creates an authenticated fetch request with CSRF token and auth error handling
 */
export const createAuthenticatedFetch = async (
  url: string,
  options: FrappeAPIRequestOptions = {}
): Promise<Response> => {
  const {
    method = 'GET',
    headers = {},
    body,
    credentials = 'include',
    ...otherOptions
  } = options;

  // Add CSRF token to headers
  const authHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Frappe-CSRF-Token': (window as any).csrf_token || '',
    ...headers
  };

  const fetchOptions: RequestInit = {
    method,
    headers: authHeaders,
    credentials,
    ...otherOptions
  };

  // Add body for POST/PUT requests
  if (body && (method === 'POST' || method === 'PUT')) {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    
    // Handle authentication errors
    await handleAuthError(response);
    
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Shorthand for Frappe API method calls
 */
export const frappeMethodCall = async (
  method: string,
  data: any = {},
  options: Omit<FrappeAPIRequestOptions, 'body'> = {}
): Promise<Response> => {
  return createAuthenticatedFetch(`/api/method/${method}`, {
    method: 'POST',
    body: data,
    ...options
  });
};

/**
 * Shorthand for Frappe resource API calls
 */
export const frappeResourceCall = async (
  doctype: string,
  name?: string,
  options: FrappeAPIRequestOptions = {}
): Promise<Response> => {
  const url = name ? `/api/resource/${doctype}/${name}` : `/api/resource/${doctype}`;
  return createAuthenticatedFetch(url, options);
};
