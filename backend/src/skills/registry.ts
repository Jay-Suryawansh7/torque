import type { IAgentSkill, SkillInput, SkillOutput } from "../core/interfaces/IAgentSkill";
import type { ExecutionContext } from "../core/interfaces/IConnector";
import { z } from "zod";
import { evaluate } from "mathjs";

const _skills = new Map<string, IAgentSkill>();

function register(skill: IAgentSkill) { _skills.set(skill.id, skill); }

// ── Web Search (via Brave Search API or fallback mock) ──
register({
  id: "web_search",
  name: "Web Search",
  description: "Search the web for current information. Returns title, URL, and snippet for each result.",
  inputSchema: z.object({ query: z.string(), numResults: z.number().min(1).max(10).default(5) }),
  outputSchema: z.object({ results: z.array(z.object({ title: z.string(), url: z.string(), snippet: z.string() })) }),
  async execute(input: SkillInput, _context: ExecutionContext): Promise<SkillOutput> {
    const key = process.env.BRAVE_API_KEY || "";
    if (key) {
      try {
        const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(input.query as string)}&count=${input.numResults || 5}`, {
          headers: { "Accept": "application/json", "Accept-Encoding": "gzip", "X-Subscription-Token": key },
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const d = await res.json() as any;
          const results = (d.web?.results || []).map((r: any) => ({ title: r.title, url: r.url, snippet: r.description }));
          return { result: { results } };
        }
      } catch { /* fall through to fallback */ }
    }
    // Fallback: Google search via scraping
    try {
      const html = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(input.query as string)}`, {
        headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000),
      }).then(r => r.text());
      const results: { title: string; url: string; snippet: string }[] = [];
      const linkRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
      const links: string[] = []; const titles: string[] = []; const snippets: string[] = [];
      let m;
      while ((m = linkRegex.exec(html)) && links.length < (input.numResults as number || 5)) { links.push(m[1]); titles.push(m[2].replace(/<[^>]*>/g, '').trim()); }
      while ((m = snippetRegex.exec(html)) && snippets.length < (input.numResults as number || 5)) { snippets.push(m[1].replace(/<[^>]*>/g, '').trim()); }
      for (let i = 0; i < links.length; i++) results.push({ title: titles[i] || '', url: links[i] || '', snippet: snippets[i] || '' });
      if (results.length > 0) return { result: { results } };
    } catch { /* fall through to mock */ }
    return { result: { results: [{ title: `Results for: ${input.query}`, url: "https://example.com", snippet: "Search unavailable — configure BRAVE_API_KEY for live results" }] } };
  },
});

// ── HTTP Request (agent-callable) ──
register({
  id: "http_request",
  name: "HTTP Request",
  description: "Make an HTTP request to any URL. Supports GET, POST, PUT, PATCH, DELETE.",
  inputSchema: z.object({ method: z.string().default("GET"), url: z.string(), headers: z.record(z.string(), z.string()).default({}), body: z.string().optional().default("") }),
  outputSchema: z.object({ status: z.number(), body: z.string() }),
  async execute(input: SkillInput, _context: ExecutionContext): Promise<SkillOutput> {
    const url = new URL(input.url as string);
    const res = await fetch(url.toString(), { method: (input.method as string) || "GET" });
    return { result: { status: res.status, body: await res.text() } };
  },
});

// ── Calculate ──
register({
  id: "calculate",
  name: "Calculate",
  description: "Evaluate a mathematical expression safely. Uses mathjs — supports arithmetic, trig, and constants.",
  inputSchema: z.object({ expression: z.string() }),
  outputSchema: z.object({ result: z.number() }),
  async execute(input: SkillInput, _context: ExecutionContext): Promise<SkillOutput> {
    const result = evaluate(input.expression as string);
    return { result: { result: typeof result === "number" ? result : parseFloat(String(result)) } };
  },
});

// ── Extract Structured Data (via LLM) ──
register({
  id: "extract_structured_data",
  name: "Extract Structured Data",
  description: "Given unstructured text and a JSON schema, extract structured data using an LLM.",
  inputSchema: z.object({ text: z.string(), schema: z.string() }),
  outputSchema: z.object({ extracted: z.record(z.string(), z.unknown()) }),
  async execute(input: SkillInput, _context: ExecutionContext): Promise<SkillOutput> {
    const key = process.env.OPENAI_API_KEY || "";
    if (key) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "gpt-4o-mini", messages: [
            { role: "system", content: `Extract structured data from the text below matching this JSON schema: ${input.schema}. Return ONLY valid JSON.` },
            { role: "user", content: input.text as string },
          ], temperature: 0.1, max_tokens: 2000 }),
          signal: AbortSignal.timeout(15000),
        });
        if (res.ok) { const d = await res.json() as any; const c = d.choices?.[0]?.message?.content; if (c) { try { return { result: { extracted: JSON.parse(c) } }; } catch {} } }
      } catch { /* fall through */ }
    }
    return { result: { extracted: { note: "LLM extraction unavailable — configure OPENAI_API_KEY", text: (input.text as string).slice(0, 200) } } };
  },
});

// ── Summarize (via LLM) ──
register({
  id: "summarize",
  name: "Summarize",
  description: "Summarize long text into a concise summary using an LLM.",
  inputSchema: z.object({ text: z.string(), maxLength: z.number().default(100), format: z.enum(["bullets", "paragraph"]).default("paragraph") }),
  outputSchema: z.object({ summary: z.string() }),
  async execute(input: SkillInput, _context: ExecutionContext): Promise<SkillOutput> {
    const key = process.env.OPENAI_API_KEY || "";
    if (key) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "gpt-4o-mini", messages: [
            { role: "system", content: `Summarize the following text in ${input.format === "bullets" ? "bullet points" : "a paragraph"}. Keep it under ${input.maxLength || 100} words.` },
            { role: "user", content: input.text as string },
          ], temperature: 0.3, max_tokens: 1000 }),
          signal: AbortSignal.timeout(15000),
        });
        if (res.ok) { const d = await res.json() as any; const c = d.choices?.[0]?.message?.content; if (c) return { result: { summary: c } }; }
      } catch { /* fall through */ }
    }
    const text = input.text as string;
    return { result: { summary: text.length > 200 ? text.slice(0, (input.maxLength as number) * 5) + "..." : text } };
  },
});

// ── Format Date ──
register({
  id: "format_date",
  name: "Format Date",
  description: "Parse and format date strings to a desired output format.",
  inputSchema: z.object({ date: z.string(), outputFormat: z.string().default("YYYY-MM-DD") }),
  outputSchema: z.object({ formatted: z.string() }),
  async execute(input: SkillInput, _context: ExecutionContext): Promise<SkillOutput> {
    const d = new Date(input.date as string);
    return { result: { formatted: isNaN(d.getTime()) ? input.date : d.toISOString().slice(0, 10) } };
  },
});

export function listSkills(): IAgentSkill[] { return Array.from(_skills.values()); }
export function getSkill(id: string): IAgentSkill | undefined { return _skills.get(id); }
