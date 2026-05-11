export class ConnectorError extends Error {
  public readonly connectorId: string;
  public readonly operationId: string;
  public readonly statusCode: number;
  public readonly retryable: boolean;

  constructor(params: { connectorId: string; operationId: string; message: string; statusCode?: number; retryable?: boolean; cause?: unknown }) {
    super(params.message);
    this.name = "ConnectorError";
    this.connectorId = params.connectorId;
    this.operationId = params.operationId;
    this.statusCode = params.statusCode ?? 500;
    this.retryable = params.retryable ?? false;
    if (params.cause && params.cause instanceof Error) this.stack = params.cause.stack;
  }

  toJSON() {
    return { error: "ConnectorError", connectorId: this.connectorId, operationId: this.operationId, message: this.message, statusCode: this.statusCode, retryable: this.retryable };
  }
}
