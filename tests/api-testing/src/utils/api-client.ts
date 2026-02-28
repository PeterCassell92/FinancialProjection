/**
 * Simple API client for making HTTP requests to the Next.js API
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async get<T = any>(path: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`);
    return response.json() as Promise<ApiResponse<T>>;
  }

  async post<T = any>(path: string, body: any): Promise<{ status: number; data: ApiResponse<T> }> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return {
      status: response.status,
      data: await response.json() as ApiResponse<T>,
    };
  }

  async put<T = any>(path: string, body: any): Promise<{ status: number; data: ApiResponse<T> }> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return {
      status: response.status,
      data: await response.json() as ApiResponse<T>,
    };
  }

  async delete<T = any>(path: string): Promise<{ status: number; data: ApiResponse<T> }> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
    });

    return {
      status: response.status,
      data: await response.json() as ApiResponse<T>,
    };
  }

  /**
   * POST with FormData (for file uploads)
   * Does NOT set Content-Type header — browser/fetch sets multipart boundary automatically
   */
  async postFormData<T = any>(path: string, formData: FormData): Promise<{ status: number; data: ApiResponse<T> }> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      body: formData,
    });

    return {
      status: response.status,
      data: await response.json() as ApiResponse<T>,
    };
  }
}

export const apiClient = new ApiClient();
