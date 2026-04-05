/**
 * Knowledge Terrarium API Client
 * Handles authenticated HTTP requests to the Terrarium REST API
 */

export class TerrariumClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'http://localhost:3000') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  // ============================================================
  // Notes
  // ============================================================

  async listNotes(options?: {
    limit?: number;
    offset?: number;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));

    const path = `/api/notes${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request('GET', path);
  }

  async getNote(id: string): Promise<any> {
    return this.request('GET', `/api/notes/${id}`);
  }

  async createNote(input: {
    title: string;
    content?: string;
  }): Promise<any> {
    return this.request('POST', '/api/notes', input);
  }

  async updateNote(
    id: string,
    input: { title?: string; content?: string }
  ): Promise<any> {
    return this.request('PUT', `/api/notes/${id}`, input);
  }

  async deleteNote(id: string): Promise<any> {
    return this.request('DELETE', `/api/notes/${id}`);
  }

  // ============================================================
  // Search
  // ============================================================

  async searchNotes(query: string): Promise<any> {
    return this.request('GET', `/api/search?q=${encodeURIComponent(query)}`);
  }

  // ============================================================
  // Private
  // ============================================================

  private async request(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: Record<string, unknown>
  ): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = { method, headers };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Terrarium API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }
}
