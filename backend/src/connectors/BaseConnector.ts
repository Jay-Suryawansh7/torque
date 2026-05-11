import type { IConnector, IOperation, ExecutionContext, OperationOutput, ConnectionTestResult, AuthConfig } from "../core/interfaces/IConnector";

export abstract class BaseConnector implements IConnector {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract icon: string;
  abstract category: IConnector["category"];
  abstract authType: IConnector["authType"];
  abstract authConfig: AuthConfig;
  abstract operations: IOperation[];

  abstract testConnection(credential: Record<string, unknown>): Promise<ConnectionTestResult>;

  async withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 1000): Promise<T> {
    let lastErr: Error | undefined;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, delayMs * Math.pow(2, attempt)));
        }
      }
    }
    throw lastErr!;
  }

  normalizeError(err: unknown, context?: string): string {
    const msg = err instanceof Error ? err.message : String(err);
    return context ? `${context}: ${msg}` : msg;
  }

  buildHeaders(credential: Record<string, unknown>, authType: string): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (authType === "api_key" && this.authConfig.apiKey) {
      const key = String(credential.apiKey || credential.api_key || "");
      if (this.authConfig.apiKey.type === "header") {
        headers[this.authConfig.apiKey.header] = key;
      }
    }
    if (authType === "bearer" || authType === "oauth2") {
      const token = String(credential.accessToken || credential.access_token || "");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    if (authType === "basic" && credential.username && credential.password) {
      const encoded = Buffer.from(`${credential.username}:${credential.password}`).toString("base64");
      headers["Authorization"] = `Basic ${encoded}`;
    }
    return headers;
  }
}
