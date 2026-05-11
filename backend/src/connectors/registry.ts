import type { IConnector, IOperation } from "../core/interfaces/IConnector.js";
import { HttpConnector } from "./HttpConnector.js";
import { CodeConnector } from "./CodeConnector.js";
import { TransformConnector } from "./TransformConnector.js";
import { GmailConnector } from "./GmailConnector.js";
import { SlackConnector } from "./SlackConnector.js";
import { GitHubConnector } from "./GitHubConnector.js";
import { OpenAIConnector } from "./OpenAIConnector.js";
import { StripeConnector } from "./StripeConnector.js";
import { RssConnector } from "./RssConnector.js";
import { DiscordConnector } from "./DiscordConnector.js";
import { AnthropicConnector } from "./AnthropicConnector.js";
import {
  TelegramConnector, NotionConnector, GoogleSheetsConnector, GoogleDocsConnector,
  GoogleCalendarConnector, AirtableConnector, GitLabConnector, JiraConnector,
  LinearConnector, PostgresConnector, MongoConnector, HubSpotConnector,
  SalesforceConnector, S3Connector, GoogleDriveConnector, EmailConnector,
} from "./batch-connectors.js";

const _registry = new Map<string, IConnector>();
function register(ctor: new () => IConnector) { const i = new ctor(); _registry.set(i.id, i); }

// Real connectors (make real API calls)
register(HttpConnector); register(CodeConnector); register(TransformConnector);
register(GmailConnector); register(SlackConnector); register(GitHubConnector);
register(OpenAIConnector); register(StripeConnector); register(RssConnector);
register(DiscordConnector); register(AnthropicConnector);

// Stub connectors (return 501 with docs URL)
register(TelegramConnector); register(NotionConnector);
register(GoogleSheetsConnector); register(GoogleDocsConnector);
register(GoogleCalendarConnector); register(AirtableConnector);
register(GitLabConnector); register(JiraConnector); register(LinearConnector);
register(PostgresConnector); register(MongoConnector);
register(HubSpotConnector); register(SalesforceConnector);
register(S3Connector); register(GoogleDriveConnector);
register(EmailConnector);

export function listConnectors(): IConnector[] { return Array.from(_registry.values()); }
export function getConnector(id: string): IConnector | undefined { return _registry.get(id); }
export function getOperations(connectorId: string): IOperation[] { return _registry.get(connectorId)?.operations || []; }
export function getOperation(connectorId: string, operationId: string): IOperation | undefined {
  return _registry.get(connectorId)?.operations.find(o => o.id === operationId);
}
