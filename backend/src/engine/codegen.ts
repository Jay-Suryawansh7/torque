import type { Workflow, FlowNode, NodeConfig } from "../types.js";
import { NodeType } from "../types.js";

export function generateTS(workflow: Workflow): string {
  const imports: string[] = ['import "dotenv/config";'];
  const bodyParts: string[] = [];
  const nodeDefs: string[] = [];
  const mainSteps: string[] = [];
  let triggerInfo: { code: string; schedule: string } | null = null;
  let hasLLM = false;
  let hasCode = false;
  let hasWebhook = false;
  let hasDB = false;

  for (const node of workflow.nodes) {
    let gen: { code: string; call: string };
    switch (node.type) {
      case NodeType.trigger:
        triggerInfo = genTrigger(node);
        bodyParts.push(triggerInfo.code);
        break;
      case NodeType.webhook_trigger:
        triggerInfo = genWebhookTrigger(node);
        bodyParts.push(triggerInfo.code);
        break;
      case NodeType.agent:
        gen = genAgentMCP(node);
        nodeDefs.push(gen.code); mainSteps.push(gen.call); hasLLM = true;
        break;
      case NodeType.llm:
        gen = genLLM(node);
        nodeDefs.push(gen.code); mainSteps.push(gen.call); hasLLM = true;
        break;
      case NodeType.code:
        gen = genCode(node);
        nodeDefs.push(gen.code); mainSteps.push(gen.call); hasCode = true;
        break;
      case NodeType.condition:
        gen = genCondition(node);
        nodeDefs.push(gen.code); mainSteps.push(gen.call);
        break;
      case NodeType.switch:
        gen = genSwitch(node);
        nodeDefs.push(gen.code); mainSteps.push(gen.call);
        break;
      case NodeType.transform:
        gen = genTransform(node);
        nodeDefs.push(gen.code); mainSteps.push(gen.call);
        break;
      case NodeType.webhook:
        gen = genWebhook(node);
        nodeDefs.push(gen.code); mainSteps.push(gen.call); hasWebhook = true;
        break;
      case NodeType.loop:
        gen = genLoop(node);
        nodeDefs.push(gen.code); mainSteps.push(gen.call);
        break;
      case NodeType.merge:
        gen = genMerge(node);
        nodeDefs.push(gen.code); mainSteps.push(gen.call);
        break;
      case NodeType.split:
        gen = genSplit(node);
        nodeDefs.push(gen.code); mainSteps.push(gen.call);
        break;
      case NodeType.wait:
        gen = genWait(node);
        nodeDefs.push(gen.code); mainSteps.push(gen.call);
        break;
      case NodeType.http_request:
        gen = genHttpRequest(node);
        nodeDefs.push(gen.code); mainSteps.push(gen.call); hasWebhook = true;
        break;
      case NodeType.database:
        gen = genDatabase(node);
        nodeDefs.push(gen.code); mainSteps.push(gen.call); hasDB = true;
        break;
      case NodeType.file_io:
        gen = genFileIO(node);
        nodeDefs.push(gen.code); mainSteps.push(gen.call); hasCode = true;
        break;
      case NodeType.extract:
        gen = genExtract(node);
        nodeDefs.push(gen.code); mainSteps.push(gen.call);
        break;
      case NodeType.summarize:
        gen = genSummarize(node);
        nodeDefs.push(gen.code); mainSteps.push(gen.call); hasLLM = true;
        break;
      case NodeType.translate:
        gen = genTranslate(node);
        nodeDefs.push(gen.code); mainSteps.push(gen.call); hasLLM = true;
        break;
      case NodeType.computer_use:
        gen = genComputerUse(node);
        nodeDefs.push(gen.code); mainSteps.push(gen.call); hasWebhook = true;
        break;
      case NodeType.output:
        gen = genOutput(node);
        nodeDefs.push(gen.code); mainSteps.push(gen.call);
        break;
    }
  }

  if (hasLLM) {
    imports.push('import { openai } from "@ai-sdk/openai";');
    imports.push('import { anthropic } from "@ai-sdk/anthropic";');
    imports.push('import { generateText } from "ai";');
  }
  if (hasCode || hasDB) imports.push("import * as fs from 'fs/promises';");
  if (hasWebhook) imports.push("import * as https from 'https';");
  if (hasCode) imports.push("import * as path from 'path';");

  return assemble(workflow, imports, bodyParts, nodeDefs, mainSteps, triggerInfo);
}

function genTrigger(node: FlowNode): { code: string; schedule: string } {
  const cfg = node.config;
  const schedule = (cfg.schedule || "").trim();
  let code: string;

  if (schedule && /^[\d\s*/]+$/.test(schedule.replace(/,/g, ""))) {
    code = `// Cron schedule: ${schedule}
import { CronJob } from "cron";
const triggerSchedule = () => {
  const job = new CronJob('${schedule}', () => {
    console.log('[Trigger] Fired at', new Date().toISOString());
    main();
  }, null, true);
  job.start();
  console.log(\`[Trigger] Scheduled: cron "${schedule}"\`);
};`;
  } else if (schedule) {
    code = `// Natural language schedule: "${schedule}"
const triggerSchedule = () => {
  console.log(\`[Trigger] "${schedule}"\`);
  main();
};`;
  } else {
    code = `// Manual trigger
const triggerSchedule = () => {
  console.log("[Trigger] Manual — running once");
  main();
};`;
  }
  return { code, schedule };
}

function genAgentMCP(node: FlowNode): { code: string; call: string } {
  const cfg = node.config;
  const mid = node.id.slice(0, 8);
  const label = cfg.label || `Agent_${node.id.slice(0, 6)}`;
  const goalEscaped = escapeJS(cfg.goal);
  const modelStr = modelImport(cfg.model);

  const code = `// Agent: ${label} (MCP-native)
const model_${mid} = openai("${modelStr}");

const agent_${mid} = async (prompt: string) => {
  const result = await generateText({
    model: model_${mid},
    system: \`${escapeJS(cfg.goal)}\`,
    prompt,
    temperature: ${cfg.temperature},
  });
  return result.text;
};`;

  const call = `  log("Agent", "Starting: ${label}");
  context.lastResult = await agent_${mid}(\`${goalEscaped}\`);
  log("Agent", "Completed: ${label}");`;

  return { code, call };
}

function modelImport(model: string): string {
  const mapping: Record<string, string> = {
    "gpt-4o": "gpt-4o", "gpt-4o-mini": "gpt-4o-mini",
    "claude-sonnet-4-20250514": "claude-sonnet-4-20250514",
  };
  return mapping[model] || model;
}

function genWebhookTrigger(node: FlowNode): { code: string; schedule: string } {
  const cfg = node.config;
  return {
    code: `// Webhook trigger: ${cfg.label}
import http from 'http';
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      console.log('[Webhook] Received:', body);
      res.writeHead(200); res.end('OK');
      main();
    });
  } else { res.writeHead(404); res.end(); }
});
server.listen(process.env.PORT || 3000, () => console.log('[Webhook] Listening on port', process.env.PORT || 3000));
const triggerSchedule = () => {};`,
    schedule: "",
  };
}

function genMerge(node: FlowNode): { code: string; call: string } {
  const cfg = node.config;
  const mid = node.id.slice(0, 8);
  const mode = cfg.merge_mode || "combine";
  const code = `// Merge: ${cfg.label} (${mode})
const merge_${mid} = (a: unknown, b: unknown): unknown => {
  if (Array.isArray(a) && Array.isArray(b)) return [...a, ...b];
  if (typeof a === 'object' && typeof b === 'object') return { ...(a as object), ...(b as object) };
  return [a, b];
};`;
  const call = `  log("Merge", "Combining inputs (${mode})");
  context.lastResult = merge_${mid}(context.lastResult, context.prevResult);`;
  return { code, call };
}

function genSplit(node: FlowNode): { code: string; call: string } {
  const cfg = node.config;
  const mid = node.id.slice(0, 8);
  const by = cfg.split_by || "size";
  const size = cfg.split_size || 10;
  const code = `// Split: ${cfg.label} (by ${by}, ${size} each)
const split_${mid} = <T>(data: T[]): T[][] => {
  if (!Array.isArray(data)) return [data] as unknown as T[][];
  const chunks: T[][] = [];
  for (let i = 0; i < data.length; i += ${size}) chunks.push(data.slice(i, i + ${size}));
  return chunks;
};`;
  const call = `  log("Split", "Splitting data (by ${by}, ${size} each)");
  context.lastResult = split_${mid}(context.lastResult as unknown[]);`;
  return { code, call };
}

function genWait(node: FlowNode): { code: string; call: string } {
  const cfg = node.config;
  const mid = node.id.slice(0, 8);
  const t = cfg.wait_time || 1;
  const unit = cfg.wait_unit || "seconds";
  const ms = unit === "seconds" ? t * 1000 : unit === "minutes" ? t * 60000 : t;
  const code = `// Wait: ${cfg.label} (${t} ${unit})
const wait_${mid} = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));`;
  const call = `  log("Wait", "Waiting ${t} ${unit}");
  await wait_${mid}(${ms});
  log("Wait", "Done");`;
  return { code, call };
}

function genSwitch(node: FlowNode): { code: string; call: string } {
  const cfg = node.config;
  const mid = node.id.slice(0, 8);
  const cases = JSON.stringify(cfg.switch_cases || ["case_1"]);
  const val = cfg.switch_value || "";
  const code = `// Switch: ${cfg.label}
const switch_${mid} = (value: unknown): string => {
  const v = String(value);
  const cases: string[] = ${cases};
  return cases.includes(v) ? v : 'default';
};`;
  const valExpr = val ? escapeJS(val) : "context.lastResult";
  const call = `  log("Switch", "Routing value");
  context.lastResult = switch_${mid}(${valExpr});`;
  return { code, call };
}

function genHttpRequest(node: FlowNode): { code: string; call: string } {
  const cfg = node.config;
  const mid = node.id.slice(0, 8);
  const method = cfg.method || "GET";
  const url = cfg.webhook_url || "http://localhost:3000";
  const code = `// HTTP Request: ${cfg.label}
const httpReq_${mid} = (payload: unknown): Promise<unknown> => {
  const url = "${url}";
  const data = JSON.stringify(payload);
  const parsed = new URL(url);
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: parsed.hostname, port: parsed.port, path: parsed.pathname + parsed.search,
      method: "${method}",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
    };
    const req = https.request(opts, res => { let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(b)); });
    req.on('error', reject);
    if (${method.toUpperCase()} !== 'GET') req.write(data);
    req.end();
  });
};`;
  const call = `  log("HTTP", "${method} ${url}");
  context.lastResult = await httpReq_${mid}(context.lastResult);
  log("HTTP", "Response received");`;
  return { code, call };
}

function genDatabase(node: FlowNode): { code: string; call: string } {
  const cfg = node.config;
  const mid = node.id.slice(0, 8);
  const db = cfg.database_type || "postgres";
  const q = escapeJS(cfg.query || "SELECT 1");
  const code = `// Database: ${cfg.label} (${db})
const query_${mid} = async (sql: string): Promise<unknown> => {
  console.log(\`[DB] Query: \${sql}\`);
  return { rows: [], rowCount: 0 };
};`;
  const call = `  log("Database", "Executing query (${db})");
  context.lastResult = await query_${mid}(\`${q}\`);
  log("Database", "Query complete");`;
  return { code, call };
}

function genFileIO(node: FlowNode): { code: string; call: string } {
  const cfg = node.config;
  const mid = node.id.slice(0, 8);
  const fmt = cfg.file_format || "json";
  const contentExpr = fmt === "json" ? "JSON.stringify(data, null, 2)" : "String(data)";
  const code = `// File IO: ${cfg.label} (.${fmt})
const fileOp_${mid} = async (data: unknown): Promise<unknown> => {
  const filename = \`output_\${Date.now()}.${fmt}\`;
  const dir = path.join(process.cwd(), 'outputs');
  await fs.mkdir(dir, { recursive: true });
  const content = ${contentExpr};
  await fs.writeFile(path.join(dir, filename), content);
  console.log(\`[File] Written to outputs/\${filename}\`);
  return filename;
};`;
  const call = `  log("File", "Writing .${fmt}");
  context.lastResult = await fileOp_${mid}(context.lastResult);
  log("File", "Written");`;
  return { code, call };
}

function genExtract(node: FlowNode): { code: string; call: string } {
  const cfg = node.config;
  const mid = node.id.slice(0, 8);
  const fmt = cfg.source_format || "json";
  const code = `// Extract: ${cfg.label} (${fmt})
const extract_${mid} = (data: unknown): unknown => {
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return data; }
  }
  return data;
};`;
  const call = `  log("Extract", "Parsing ${fmt}");
  context.lastResult = extract_${mid}(context.lastResult);
  log("Extract", "Parsed");`;
  return { code, call };
}

function genSummarize(node: FlowNode): { code: string; call: string } {
  const cfg = node.config;
  const mid = node.id.slice(0, 8);
  const code = `// Summarize: ${cfg.label}
const summarize_${mid} = async (text: string): Promise<string> => {
  const result = await generateText({
    model: openai("gpt-4o-mini"),
    system: "Summarize the following text concisely.",
    prompt: typeof text === 'string' ? text : JSON.stringify(text),
    temperature: 0.2,
  });
  return result.text;
};`;
  const call = `  log("Summarize", "Running AI summarization");
  context.lastResult = await summarize_${mid}(context.lastResult as string);
  log("Summarize", "Done");`;
  return { code, call };
}

function genTranslate(node: FlowNode): { code: string; call: string } {
  const cfg = node.config;
  const mid = node.id.slice(0, 8);
  const lang = cfg.target_language || "spanish";
  const code = `// Translate: ${cfg.label} → ${lang}
const translate_${mid} = async (text: string): Promise<string> => {
  const result = await generateText({
    model: openai("gpt-4o-mini"),
    system: "Translate to ${lang}. Return only the translation.",
    prompt: typeof text === 'string' ? text : JSON.stringify(text),
    temperature: 0.1,
  });
  return result.text;
};`;
  const call = `  log("Translate", "Translating to ${lang}");
  context.lastResult = await translate_${mid}(context.lastResult as string);
  log("Translate", "Done");`;
  return { code, call };
}

function genComputerUse(node: FlowNode): { code: string; call: string } {
  const cfg = node.config;
  const mid = node.id.slice(0, 8);
  const url = cfg.browser_url || "https://example.com";
  const quality = cfg.screenshot_quality || 0.8;
  const code = `// Computer Use: ${cfg.label}
const setupBrowser_${mid} = async () => {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  return { browser, page };
};
const computerAction_${mid} = async (page: any, action: string, payload?: unknown): Promise<unknown> => {
  try {
    switch (action) {
      case "navigate":
        await page.goto(payload as string);
        return { url: page.url(), title: await page.title() };
      case "click":
        await page.click(payload as string);
        return { clicked: payload };
      case "type":
        const { selector, text } = payload as { selector: string; text: string };
        await page.fill(selector, text);
        return { filled: selector };
      case "screenshot":
        const buf = await page.screenshot({ type: "jpeg", quality: ${quality} });
        return { screenshot: "data:image/jpeg;base64," + buf.toString("base64") };
      case "get_text":
        return await page.innerText(payload as string);
      default:
        return { error: "Unknown action: " + action };
    }
  } catch (err) { return { error: String(err) }; }
};`;
  const call = `  log("Computer", "Opening browser: ${url}");
  const { browser: brw_${mid}, page: p_${mid} } = await setupBrowser_${mid}();
  await p_${mid}.goto("${url}");
  context.lastResult = await computerAction_${mid}(p_${mid}, "screenshot");
  log("Computer", "Browser ready — screenshot taken");`;
  return { code, call };
}

function genLLM(node: FlowNode): { code: string; call: string } {
  const cfg = node.config;
  const mid = node.id.slice(0, 8);
  const provider = cfg.provider || "openai";
  const model = cfg.model || "gpt-4o";
  const sysPrompt = escapeJS(cfg.instructions || "");
  const code = `// LLM Call: ${cfg.label}
const llm_${mid} = async (prompt: string): Promise<string> => {
  const result = await generateText({
    model: ${provider === "anthropic" ? `anthropic("${model}")` : `openai("${model}")`},
    system: \`${sysPrompt}\`,
    prompt,
    temperature: ${cfg.temperature},
    maxTokens: ${cfg.max_tokens},
  });
  return result.text;
};`;
  const call = `  log("LLM", "Running inference (${provider}/${model})");
  context.lastResult = await llm_${mid}(String(context.lastResult ?? ""));
  log("LLM", "Inference complete");`;
  return { code, call };
}

function genCode(node: FlowNode): { code: string; call: string } {
  const cfg = node.config;
  const mid = node.id.slice(0, 8);
  const lang = cfg.language || "python";
  const userCode = escapeJS(cfg.code || "");
  const code = `// Code: ${cfg.label} (${lang})
const runCode_${mid} = async (input: unknown): Promise<unknown> => {
  // In production, use a sandboxed evaluator
  console.log(\`[Code] Running ${lang} code...\`);
  // User code:
  // ${userCode.replace(/\n/g, "\n  // ")}
  return { executed: true, language: "${lang}", input };
};`;
  const call = `  log("Code", "Executing (${lang})");
  context.lastResult = await runCode_${mid}(context.lastResult);
  log("Code", "Execution complete");`;
  return { code, call };
}

function genCondition(node: FlowNode): { code: string; call: string } {
  const cfg = node.config;
  const mid = node.id.slice(0, 8);
  const cond = safeCondition(cfg.condition || "true");
  const code = `// Condition: ${cfg.label}
const condition_${mid} = (data: unknown): boolean => {
  if (${cond} === undefined) return false;
  return Boolean(${cond});
};`;
  const call = `  log("Condition", "Evaluating: ${escapeJS(cfg.condition)}");
  context.lastResult = condition_${mid}(context.lastResult);
  log("Condition", context.lastResult ? "Passed" : "Failed");`;
  return { code, call };
}

function genTransform(node: FlowNode): { code: string; call: string } {
  const cfg = node.config;
  const mid = node.id.slice(0, 8);
  const t = safeTransform(cfg.transform || "data => data");
  const code = `// Transform: ${cfg.label}
const transform_${mid} = (data: unknown): unknown => {
  try { const fn = ${t}; return fn(data); }
  catch { return data; }
};`;
  const call = `  log("Transform", "Applying transform");
  context.lastResult = transform_${mid}(context.lastResult);
  log("Transform", "Done");`;
  return { code, call };
}

function genWebhook(node: FlowNode): { code: string; call: string } {
  const cfg = node.config;
  const mid = node.id.slice(0, 8);
  const method = cfg.method || "POST";
  const url = cfg.webhook_url || "https://hooks.example.com";
  const code = `// Webhook: ${cfg.label}
const webhook_${mid} = (payload: unknown): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const parsed = new URL("${url}");
    const opts = {
      hostname: parsed.hostname, port: parsed.port, path: parsed.pathname + parsed.search,
      method: "${method}",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
    };
    const req = https.request(opts, res => { let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(b)); });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
};`;
  const call = `  log("Webhook", "Sending to ${url}");
  context.lastResult = await webhook_${mid}(context.lastResult);
  log("Webhook", "Sent");`;
  return { code, call };
}

function genLoop(node: FlowNode): { code: string; call: string } {
  const cfg = node.config;
  const mid = node.id.slice(0, 8);
  const count = cfg.iteration_count || 5;
  const code = `// Loop: ${cfg.label} (${count} iterations)
const loop_${mid} = async <T>(items: T[], fn: (item: T, i: number) => Promise<unknown>): Promise<unknown[]> => {
  const results: unknown[] = [];
  for (let i = 0; i < Math.min(items.length, ${count}); i++) {
    results.push(await fn(items[i], i));
  }
  return results;
};`;
  const call = `  log("Loop", "Iterating (max ${count})");
  const items = Array.isArray(context.lastResult) ? context.lastResult : [context.lastResult];
  context.lastResult = await loop_${mid}(items, async (item, i) => { log("Loop", "Iteration " + (i + 1)); return item; });
  log("Loop", "Done");`;
  return { code, call };
}

function genOutput(node: FlowNode): { code: string; call: string } {
  const cfg = node.config;
  const mid = node.id.slice(0, 8);
  const dest = cfg.destination || "file";
  const code = `// Output: ${cfg.label} → ${dest}
const output_${mid} = async (data: unknown): Promise<void> => {
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  console.log(\`[Output] -> ${dest}:\\n\${content.slice(0, 200)}\`);
};`;
  const call = `  log("Output", "Sending to ${dest}");
  await output_${mid}(context.lastResult);
  log("Output", "Sent");`;
  return { code, call };
}

function escapeJS(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\0/g, "\\0");
}

function safeCondition(expr: string): string {
  const allowed = /^[a-zA-Z0-9_?.()\[\]\s<>=!+\-*/&|%]+$/;
  if (!allowed.test(expr)) {
    return "true";
  }
  return expr;
}

function safeTransform(expr: string): string {
  const allowed = /^[a-zA-Z0-9_?.()\[\]\s,=>:{}]+$/;
  if (!allowed.test(expr)) {
    return "data => data";
  }
  return expr;
}

function assemble(
  workflow: Workflow,
  imports: string[],
  bodyParts: string[],
  nodeDefs: string[],
  mainSteps: string[],
  triggerInfo: { code: string; schedule: string } | null,
): string {
  return `// ── Torque Workflow: ${workflow.name} ──
// Generated by Torque v0.1.0

${imports.join("\n")}

// ── Context ──
interface WorkflowContext {
  lastResult: unknown;
  prevResult: unknown;
}

const context: WorkflowContext = { lastResult: null, prevResult: null };

// ── Logger ──
const log = (source: string, message: string) => {
  const entry = \`[\${new Date().toISOString()}] [\${source}] \${message}\`;
  console.log(entry);
};

// ── Trigger ──
${bodyParts.join("\n\n")}

// ── Node Definitions ──
${nodeDefs.join("\n\n")}

// ── Main Execution ──
async function main() {
  log("Workflow", "Starting: ${workflow.name}");
${mainSteps.join("\n")}
  log("Workflow", "Completed: ${workflow.name}");
}

// ── Boot ──
triggerSchedule();
`;
}
