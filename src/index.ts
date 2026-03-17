/**
 * OpenClaw SDK
 * TypeScript SDK for interacting with OpenClaw services
 */

export interface ClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export class OpenClawClient {
  private config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = {
      baseUrl: config.baseUrl ?? 'https://api.openclaw.example.com',
      timeout: config.timeout ?? 30000,
      ...config,
    };
  }

  /**
   * Get the current configuration
   */
  getConfig(): Readonly<ClientConfig> {
    return this.config;
  }

  /**
   * Check if the client is properly configured
   */
  isReady(): boolean {
    return !!this.config.apiKey;
  }
}

export default OpenClawClient;
