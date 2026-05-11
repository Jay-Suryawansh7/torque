/**
 * Connector stubs with clear error messages for not-yet-integrated services.
 * Each returns a ConnectorError directing users to the API documentation.
 */
import { z } from "zod";
import { BaseConnector } from "./BaseConnector";
import { ConnectorError } from "../core/ConnectorError";
import type { IOperation, ConnectionTestResult, AuthConfig, IConnector } from "../core/interfaces/IConnector";

function unimplementedOp(id: string, name: string, description: string, docsUrl: string): IOperation {
  return {
    id, name, description, type: "action",
    inputSchema: z.object({}).catchall(z.unknown()),
    outputSchema: z.object({ error: z.string() }),
    fields: [],
    async execute(_input, _cred, _ctx): Promise<any> {
      throw new ConnectorError({ connectorId: "batch", operationId: id, message: `"${name}" is not yet implemented. See ${docsUrl} for the API, or implement the connector at connectors/${id}.ts`, statusCode: 501, retryable: false });
    },
  };
}

function unimplementedConnector(id: string, name: string, description: string, icon: string, category: IConnector["category"], authType: IConnector["authType"], authConfig: AuthConfig, docsUrl: string) {
  return class extends BaseConnector {
    id = id; name = name; description = description; icon = icon; category = category; authType = authType; authConfig = authConfig;
    operations = [unimplementedOp(id, name, description, docsUrl)];
    async testConnection(): Promise<ConnectionTestResult> { return { ok: false, message: `Not implemented — see ${docsUrl}` }; }
  };
}

// Each stub has a docsUrl pointing to the real API documentation

export const TelegramConnector = unimplementedConnector("telegram", "Telegram", "Bot messages & chat updates", "https://cdn.simpleicons.org/telegram", "communication" as const, "api_key" as const, { apiKey: { header: "X-Telegram-Token", type: "header" as const } }, "https://core.telegram.org/bots/api");

export const NotionConnector = unimplementedConnector("notion", "Notion", "Databases, pages & blocks API", "https://cdn.simpleicons.org/notion", "productivity" as const, "oauth2" as const, { oauth2: { authUrl: "https://api.notion.com/v1/oauth/authorize", tokenUrl: "https://api.notion.com/v1/oauth/token", scopes: [] } }, "https://developers.notion.com");

export const GoogleSheetsConnector = unimplementedConnector("google_sheets", "Google Sheets", "Read & write spreadsheets", "https://cdn.simpleicons.org/googlesheets", "productivity" as const, "oauth2" as const, { oauth2: { authUrl: "https://accounts.google.com/o/oauth2/auth", tokenUrl: "https://oauth2.googleapis.com/token", scopes: ["https://www.googleapis.com/auth/spreadsheets"] } }, "https://developers.google.com/sheets/api");

export const GoogleDocsConnector = unimplementedConnector("google_docs", "Google Docs", "Create & edit documents", "https://cdn.simpleicons.org/googledocs", "productivity" as const, "oauth2" as const, { oauth2: { authUrl: "https://accounts.google.com/o/oauth2/auth", tokenUrl: "https://oauth2.googleapis.com/token", scopes: ["https://www.googleapis.com/auth/documents"] } }, "https://developers.google.com/docs/api");

export const GoogleCalendarConnector = unimplementedConnector("google_calendar", "Google Calendar", "Manage events & schedules", "https://cdn.simpleicons.org/googlecalendar", "productivity" as const, "oauth2" as const, { oauth2: { authUrl: "https://accounts.google.com/o/oauth2/auth", tokenUrl: "https://oauth2.googleapis.com/token", scopes: ["https://www.googleapis.com/auth/calendar"] } }, "https://developers.google.com/calendar/api");

export const AirtableConnector = unimplementedConnector("airtable", "Airtable", "Base & table management", "https://cdn.simpleicons.org/airtable", "productivity" as const, "api_key" as const, { apiKey: { header: "Authorization", type: "header" as const } }, "https://airtable.com/developers/web/api/introduction");

export const GitLabConnector = unimplementedConnector("gitlab", "GitLab", "Repos, MRs & CI pipelines", "https://cdn.simpleicons.org/gitlab", "developer" as const, "oauth2" as const, { oauth2: { authUrl: "https://gitlab.com/oauth/authorize", tokenUrl: "https://gitlab.com/oauth/token", scopes: ["api"] } }, "https://docs.gitlab.com/ee/api/");

export const JiraConnector = unimplementedConnector("jira", "Jira", "Issues, sprints & projects", "https://cdn.simpleicons.org/jira", "developer" as const, "api_key" as const, { apiKey: { header: "Authorization", type: "header" as const } }, "https://developer.atlassian.com/cloud/jira/platform/rest/v3/");

export const LinearConnector = unimplementedConnector("linear", "Linear", "Issues & project management", "https://cdn.simpleicons.org/linear", "developer" as const, "oauth2" as const, { oauth2: { authUrl: "https://linear.app/oauth/authorize", tokenUrl: "https://api.linear.app/oauth/token", scopes: ["read", "write"] } }, "https://developers.linear.app/docs/graphql/working-with-the-graphql-api");

export const PostgresConnector = unimplementedConnector("postgres", "PostgreSQL", "SQL queries & schema", "https://cdn.simpleicons.org/postgresql", "data" as const, "api_key" as const, { apiKey: { header: "X-API-Key", type: "header" as const } }, "https://node-postgres.com");

export const MongoConnector = unimplementedConnector("mongodb", "MongoDB", "Document database operations", "https://cdn.simpleicons.org/mongodb", "data" as const, "api_key" as const, { apiKey: { header: "X-API-Key", type: "header" as const } }, "https://www.mongodb.com/docs/drivers/node/current/");

export const HubSpotConnector = unimplementedConnector("hubspot", "HubSpot", "Contacts, deals & tickets", "https://cdn.simpleicons.org/hubspot", "crm" as const, "oauth2" as const, { oauth2: { authUrl: "https://app.hubspot.com/oauth/authorize", tokenUrl: "https://api.hubapi.com/oauth/v1/token", scopes: ["crm.objects.contacts.write"] } }, "https://developers.hubspot.com/docs/api/overview");

export const SalesforceConnector = unimplementedConnector("salesforce", "Salesforce", "CRM objects & records", "https://cdn.simpleicons.org/salesforce", "crm" as const, "oauth2" as const, { oauth2: { authUrl: "https://login.salesforce.com/services/oauth2/authorize", tokenUrl: "https://login.salesforce.com/services/oauth2/token", scopes: ["api"] } }, "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/");

export const S3Connector = unimplementedConnector("aws_s3", "AWS S3", "Object storage", "https://cdn.simpleicons.org/amazons3", "storage" as const, "api_key" as const, { apiKey: { header: "X-API-Key", type: "header" as const } }, "https://docs.aws.amazon.com/sdk-for-javascript/");

export const GoogleDriveConnector = unimplementedConnector("google_drive", "Google Drive", "File storage & management", "https://cdn.simpleicons.org/googledrive", "storage" as const, "oauth2" as const, { oauth2: { authUrl: "https://accounts.google.com/o/oauth2/auth", tokenUrl: "https://oauth2.googleapis.com/token", scopes: ["https://www.googleapis.com/auth/drive.file"] } }, "https://developers.google.com/drive/api");

export const EmailConnector = unimplementedConnector("email", "Email (SMTP)", "Send and receive emails", "https://cdn.simpleicons.org/maildotru", "utility" as const, "basic" as const, { basic: { label: "SMTP" } }, "https://nodemailer.com/about/");
