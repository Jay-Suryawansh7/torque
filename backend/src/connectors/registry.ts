import type { IConnector, IOperation } from "../core/interfaces/IConnector";
import { HttpConnector } from "./HttpConnector";
import { CodeConnector } from "./CodeConnector";
import { TransformConnector } from "./TransformConnector";
import { GmailConnector } from "./GmailConnector";
import { SlackConnector } from "./SlackConnector";
import { GitHubConnector } from "./GitHubConnector";
import { OpenAIConnector } from "./OpenAIConnector";
import { StripeConnector } from "./StripeConnector";
import { RssConnector } from "./RssConnector";
import { DiscordConnector } from "./DiscordConnector";
import { AnthropicConnector } from "./AnthropicConnector";
import {
  TelegramConnector, NotionConnector, GoogleSheetsConnector, GoogleDocsConnector,
  GoogleCalendarConnector, AirtableConnector, GitLabConnector, JiraConnector,
  LinearConnector, PostgresConnector, MongoConnector, HubSpotConnector,
  SalesforceConnector, S3Connector, GoogleDriveConnector, EmailConnector,
} from "./batch-connectors";

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
