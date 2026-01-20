/**
 * HTTP Client for Financial Projections API
 */

// Configuration
const API_BASE_URL = process.env.FINANCIAL_PROJECTIONS_API_URL || 'http://localhost:3000/api';

/**
 * Helper function to make HTTP requests to the Financial Projections API
 */
export async function apiRequest(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    params?: Record<string, string>;
  } = {}
): Promise<any> {
  const { method = 'GET', body, params = {} } = options;

  // Automatically add TOON format for transaction-related endpoints
  // This dramatically reduces token usage (50-70% reduction) for large transaction datasets
  if (endpoint.includes('/transaction-records')) {
    params['format'] = 'toon';
  }

  let url = `${API_BASE_URL}${endpoint}`;

  // Add query parameters
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    requestOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, requestOptions);
  const data = await response.json() as any;

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return data;
}
