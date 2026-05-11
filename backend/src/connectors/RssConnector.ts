import { z } from "zod";
import { BaseConnector } from "./BaseConnector";
import { ConnectorError } from "../core/ConnectorError";
import type { IOperation, OperationOutput, ConnectionTestResult, AuthConfig } from "../core/interfaces/IConnector";

const getFeedOp: IOperation = {
  id: "get_items", name: "Get Feed Items", description: "Fetch items from an RSS or Atom feed", type: "action",
  inputSchema: z.object({ url: z.string().url(), limit: z.number().min(1).max(50).default(10) }),
  outputSchema: z.object({ title: z.string(), items: z.array(z.object({ title: z.string(), link: z.string(), pubDate: z.string(), snippet: z.string() })) }),
  fields: [
    { id: "url", label: "Feed URL", type: "text", required: true, placeholder: "https://example.com/feed.xml" },
    { id: "limit", label: "Items", type: "number", default: 10 },
  ],
  async execute(input, _credential, _ctx): Promise<OperationOutput> {
    const p = input as { url: string; limit: number };
    const res = await fetch(p.url, { headers: { "User-Agent": "torque-rss/1.0" }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new ConnectorError({ connectorId: "rss", operationId: "get_items", message: `HTTP ${res.status} fetching feed`, statusCode: res.status });
    const xml = await res.text();

    // Simple RSS parser (no external dependency)
    const items: { title: string; link: string; pubDate: string; snippet: string }[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    const extract = (block: string, tag: string) => { const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(block); return m ? m[1].trim() : ''; };

    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < p.limit) {
      const block = match[1];
      items.push({ title: extract(block, 'title'), link: extract(block, 'link'), pubDate: extract(block, 'pubDate'), snippet: extract(block, 'description').replace(/<[^>]*>/g, '').slice(0, 300) });
    }

    const feedTitle = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(xml);
    return { data: { title: feedTitle ? feedTitle[1].trim() : p.url, items } };
  },
};

export class RssConnector extends BaseConnector {
  id = "rss"; name = "RSS / Atom"; description = "Fetch and parse RSS and Atom feeds";
  icon = "https://cdn.simpleicons.org/rss"; category = "utility" as const;
  authType = "none" as const; authConfig: AuthConfig = {};
  operations = [getFeedOp];
  async testConnection(): Promise<ConnectionTestResult> { return { ok: true }; }
}
