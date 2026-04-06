/**
 * ScopePad API Client
 * Handles authenticated HTTP requests to the ScopePad REST API
 */

interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: Record<string, unknown>;
}

export class ScopepadClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = "https://app.scopepad.com") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  // ============================================================
  // Documents
  // ============================================================

  async listDocuments(filters?: {
    type?: string;
    status?: string;
    client_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.type) params.append("type", filters.type);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.client_id) params.append("client_id", filters.client_id);
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.offset) params.append("offset", String(filters.offset));

    const path = `/api/v1/documents${params.toString() ? `?${params.toString()}` : ""}`;
    return this.request("GET", path);
  }

  async getDocument(id: string): Promise<any> {
    return this.request("GET", `/api/v1/documents/${id}`);
  }

  async createDocument(input: {
    type: string;
    title: string;
    content: Record<string, unknown>;
    client_id?: string;
    template_id?: string;
    parent_id?: string;
    metadata?: Record<string, unknown>;
    status?: string;
    ai_generated?: boolean;
  }): Promise<any> {
    return this.request("POST", "/api/v1/documents", input);
  }

  async updateDocument(
    id: string,
    input: {
      title?: string;
      content?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
      status?: string;
      client_id?: string;
    }
  ): Promise<any> {
    return this.request("PUT", `/api/v1/documents/${id}`, input);
  }

  async exportDocument(id: string): Promise<any> {
    return this.request("POST", `/api/v1/documents/${id}/export`, {});
  }

  async sendDocument(
    id: string,
    input?: { client_email?: string; message?: string }
  ): Promise<any> {
    return this.request("POST", `/api/v1/documents/${id}/send`, input || {});
  }

  async deriveDocument(
    id: string,
    input: { type: string; title: string; content?: Record<string, unknown> }
  ): Promise<any> {
    return this.request(
      "POST",
      `/api/v1/documents/${id}/derive`,
      input
    );
  }

  // ============================================================
  // Clients
  // ============================================================

  async listClients(search?: string): Promise<any> {
    const path = search ? `/api/v1/clients?search=${encodeURIComponent(search)}` : "/api/v1/clients";
    return this.request("GET", path);
  }

  async getClient(id: string): Promise<any> {
    return this.request("GET", `/api/v1/clients/${id}`);
  }

  async createClient(input: {
    name: string;
    email: string;
    company?: string;
  }): Promise<any> {
    return this.request("POST", "/api/v1/clients", input);
  }

  // ============================================================
  // Templates
  // ============================================================

  async listTemplates(filters?: {
    type?: string;
    category?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.type) params.append("type", filters.type);
    if (filters?.category) params.append("category", filters.category);

    const path = `/api/v1/templates${params.toString() ? `?${params.toString()}` : ""}`;
    return this.request("GET", path);
  }

  async getTemplate(id: string): Promise<any> {
    return this.request("GET", `/api/v1/templates/${id}`);
  }

  // ============================================================
  // Freelancer Profile & Stats
  // ============================================================

  async getProfile(): Promise<any> {
    return this.request("GET", "/api/v1/freelancer/profile");
  }

  async getDashboard(): Promise<any> {
    return this.request("GET", "/api/v1/freelancer/dashboard");
  }

  // ============================================================
  // Private
  // ============================================================

  private async request(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    path: string,
    body?: Record<string, unknown>
  ): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `ScopePad API error (${response.status}): ${errorText}`
      );
    }

    return response.json();
  }
}
