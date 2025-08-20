/**
 * Utility functions for API calls with CSRF token support
 */

export interface FrappeAPIRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
}

/**
 * Creates an authenticated fetch request with CSRF token
 */
export const createAuthenticatedFetch = (
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

  return fetch(url, fetchOptions);
};

/**
 * Shorthand for Frappe API method calls
 */
export const frappeMethodCall = (
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
export const frappeResourceCall = (
  doctype: string,
  name?: string,
  options: FrappeAPIRequestOptions = {}
): Promise<Response> => {
  const url = name ? `/api/resource/${doctype}/${name}` : `/api/resource/${doctype}`;
  return createAuthenticatedFetch(url, options);
};
