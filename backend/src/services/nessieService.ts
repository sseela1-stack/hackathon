import { env } from '../config/env';

/**
 * Thin provider wrapper around Capital One Nessie-style API
 * Generic REST API with key in header or query parameter
 * 
 * TODO: Update to real Nessie API endpoints when available
 * Current implementation uses mock/sandbox endpoints
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface CreateCustomerPayload {
  first_name: string;
  last_name: string;
  address?: {
    street_number: string;
    street_name: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface CreateCustomerResponse {
  code: number;
  message: string;
  objectCreated: {
    _id: string;
    first_name: string;
    last_name: string;
    address?: {
      street_number: string;
      street_name: string;
      city: string;
      state: string;
      zip: string;
    };
  };
}

export interface CreateAccountPayload {
  type: 'Checking' | 'Savings';
  nickname: string;
  rewards: number;
  balance: number;
}

export interface CreateAccountResponse {
  code: number;
  message: string;
  objectCreated: {
    _id: string;
    type: string;
    nickname: string;
    balance: number;
    customer_id: string;
  };
}

export interface AccountResponse {
  id: string;
  type: string;
  balance: number;
}

export interface CreateTransactionPayload {
  medium: 'balance' | 'rewards';
  amount: number;
  description?: string;
}

export interface CreateTransactionResponse {
  code: number;
  message: string;
  objectCreated: {
    _id: string;
    medium: string;
    amount: number;
    description?: string;
  };
}

export class NessieError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: unknown
  ) {
    super(message);
    this.name = 'NessieError';
  }
}

// ============================================================================
// NessieService Class
// ============================================================================

export class NessieService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number = 10000; // 10 second timeout
  private readonly maxRetries: number = 2;

  constructor(config: { apiKey: string; baseUrl: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Generic HTTP request method with retry logic and timeout
   * Implements exponential backoff with jitter for 5xx and network errors
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown
  ): Promise<T> {
    // Add API key as query parameter (Nessie API convention)
    const separator = path.includes('?') ? '&' : '?';
    const url = `${this.baseUrl}${path}${separator}key=${this.apiKey}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle non-2xx responses
        if (!response.ok) {
          const errorBody = await response.text();
          let parsedError: unknown;
          try {
            parsedError = JSON.parse(errorBody);
          } catch {
            parsedError = errorBody;
          }

          // Retry on 5xx server errors
          if (response.status >= 500 && attempt < this.maxRetries) {
            lastError = new NessieError(
              `Server error (${response.status}): ${response.statusText}`,
              response.status,
              parsedError
            );
            await this.sleep(this.calculateBackoff(attempt));
            continue;
          }

          // Don't retry on 4xx client errors
          throw new NessieError(
            `API request failed (${response.status}): ${response.statusText}`,
            response.status,
            parsedError
          );
        }

        // Parse and return successful response
        const responseText = await response.text();
        if (!responseText) {
          return {} as T;
        }

        try {
          return JSON.parse(responseText) as T;
        } catch (parseError) {
          throw new NessieError(
            `Failed to parse API response as JSON: ${responseText.substring(0, 100)}`,
            response.status,
            responseText
          );
        }
      } catch (error) {
        // Handle network errors and timeouts
        if (error instanceof TypeError || (error as Error).name === 'AbortError') {
          if (attempt < this.maxRetries) {
            lastError = new NessieError(
              `Network error or timeout: ${(error as Error).message}`
            );
            await this.sleep(this.calculateBackoff(attempt));
            continue;
          }
          throw new NessieError(
            `Network error or timeout after ${this.maxRetries + 1} attempts: ${(error as Error).message}`
          );
        }

        // Re-throw NessieError or other errors
        throw error;
      }
    }

    // If we exhausted all retries
    throw lastError || new NessieError('Request failed after all retry attempts');
  }

  /**
   * Calculate exponential backoff with jitter
   * Base delay: 500ms, doubles each retry, with random jitter
   */
  private calculateBackoff(attempt: number): number {
    const baseDelay = 500;
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
    return exponentialDelay + jitter;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ==========================================================================
  // Public API Methods
  // ==========================================================================

  /**
   * Create a new customer in the Nessie API
   * TODO: Update endpoint to real Nessie customer creation endpoint
   * Current: POST /customers (mock/sandbox)
   */
  async createCustomer(payload: CreateCustomerPayload): Promise<CreateCustomerResponse> {
    if (!payload.first_name || !payload.last_name) {
      throw new NessieError('first_name and last_name are required');
    }

    return this.request<CreateCustomerResponse>('POST', '/customers', payload);
  }

  /**
   * Create a new account for a customer
   * TODO: Update endpoint to real Nessie account creation endpoint
   * Current: POST /customers/{customerId}/accounts (mock/sandbox)
   */
  async createAccount(
    customerId: string,
    payload: CreateAccountPayload
  ): Promise<CreateAccountResponse> {
    if (!customerId) {
      throw new NessieError('customerId is required');
    }
    if (!payload.type || !payload.nickname || payload.balance === undefined || payload.rewards === undefined) {
      throw new NessieError('type, nickname, balance, and rewards are required');
    }
    if (!['Checking', 'Savings'].includes(payload.type)) {
      throw new NessieError('type must be "Checking" or "Savings"');
    }

    return this.request<CreateAccountResponse>(
      'POST',
      `/customers/${customerId}/accounts`,
      payload
    );
  }

  /**
   * List all accounts for a customer
   * TODO: Update endpoint to real Nessie account listing endpoint
   * Current: GET /customers/{customerId}/accounts (mock/sandbox)
   */
  async listAccounts(customerId: string): Promise<Array<AccountResponse>> {
    if (!customerId) {
      throw new NessieError('customerId is required');
    }

    return this.request<Array<AccountResponse>>('GET', `/customers/${customerId}/accounts`);
  }

  /**
   * Create a transaction on an account
   * TODO: Update endpoint to real Nessie transaction creation endpoint
   * Current: POST /accounts/{accountId}/transactions (mock/sandbox)
   */
  async createTransaction(
    accountId: string,
    payload: CreateTransactionPayload
  ): Promise<CreateTransactionResponse> {
    if (!accountId) {
      throw new NessieError('accountId is required');
    }
    if (!payload.medium || payload.amount === undefined) {
      throw new NessieError('medium and amount are required');
    }
    if (!['balance', 'rewards'].includes(payload.medium)) {
      throw new NessieError('medium must be "balance" or "rewards"');
    }

    return this.request<CreateTransactionResponse>(
      'POST',
      `/accounts/${accountId}/transactions`,
      payload
    );
  }

  /**
   * Get a single account by ID
   * TODO: Update endpoint to real Nessie account retrieval endpoint
   * Current: GET /accounts/{accountId} (mock/sandbox)
   */
  async getAccount(accountId: string): Promise<AccountResponse> {
    if (!accountId) {
      throw new NessieError('accountId is required');
    }

    return this.request<AccountResponse>('GET', `/accounts/${accountId}`);
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/**
 * Singleton instance configured from environment variables
 * Uses NESSIE_API_KEY and NESSIE_BASE_URL from env
 */
export const nessie = new NessieService({
  apiKey: env.nessie.apiKey,
  baseUrl: env.nessie.baseUrl,
});
