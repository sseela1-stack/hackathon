import { config } from '../config/env';

/**
 * Service for interacting with Capital One Nessie API
 * TODO: Implement actual API calls once API keys are configured
 */

export interface NessieCustomer {
  customerId: string;
  firstName: string;
  lastName: string;
}

export interface NessieAccount {
  accountId: string;
  type: 'checking' | 'savings' | 'investment';
  balance: number;
}

export interface NessieTransaction {
  transactionId: string;
  amount: number;
  description: string;
  date: Date;
}

export class NessieService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = config.nessie.apiKey;
    this.baseUrl = config.nessie.baseUrl;
  }

  /**
   * Create a new customer in Nessie
   * TODO: Implement actual API call to POST /customers
   */
  async createCustomer(firstName: string, lastName: string): Promise<NessieCustomer> {
    console.log(`TODO: Create customer ${firstName} ${lastName} via Nessie API`);
    
    // Mock response for now
    return {
      customerId: `mock-customer-${Date.now()}`,
      firstName,
      lastName,
    };
  }

  /**
   * Create a new account for a customer
   * TODO: Implement actual API call to POST /accounts
   */
  async createAccount(
    customerId: string,
    type: 'checking' | 'savings' | 'investment',
    initialBalance: number
  ): Promise<NessieAccount> {
    console.log(`TODO: Create ${type} account for customer ${customerId} via Nessie API`);
    
    // Mock response for now
    return {
      accountId: `mock-account-${type}-${Date.now()}`,
      type,
      balance: initialBalance,
    };
  }

  /**
   * Create a transaction for an account
   * TODO: Implement actual API call to POST /accounts/{id}/transactions
   */
  async createTransaction(
    accountId: string,
    amount: number,
    description: string
  ): Promise<NessieTransaction> {
    console.log(`TODO: Create transaction for account ${accountId} via Nessie API`);
    
    // Mock response for now
    return {
      transactionId: `mock-txn-${Date.now()}`,
      amount,
      description,
      date: new Date(),
    };
  }

  /**
   * Get balances for all accounts of a customer
   * TODO: Implement actual API call to GET /customers/{id}/accounts
   */
  async getBalances(customerId: string): Promise<{
    checking: number;
    savings: number;
    investment: number;
  }> {
    console.log(`TODO: Get balances for customer ${customerId} via Nessie API`);
    
    // Mock response for now
    return {
      checking: 1000,
      savings: 500,
      investment: 0,
    };
  }
}

export const nessieService = new NessieService();
