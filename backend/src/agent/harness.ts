import type { LogEntry } from "../types.js";
import { getSkill } from "../skills/registry.js";
import type { IAgentSkill, SkillInput } from "../core/interfaces/IAgentSkill.js";
import type { ExecutionContext } from "../core/interfaces/IConnector.js";

interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

interface ToolDef {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export async function runAgentLoop(
  goal: string, provider: string, model: string,
  temperature: number, maxTokens: number, maxIterations: number,
  skillIds: string[], input: unknown, ctx: ExecutionContext,
): Promise<{ output: string; logs: LogEntry[] }> {
  const logs: LogEntry[] = [];
  const log = (step: string, detail: string, status = "running") => {
    logs.push({ timestamp: Date.now() / 1000, step, detail, status });
  };

  log("init", `Agent: ${provider}/${model}, goal: ${goal.slice(0, 80)}...`);

  const enabledSkills: IAgentSkill[] = [];
  for (const id of skillIds) { const s = getSkill(id); if (s) enabledSkills.push(s); }
  log("tools", `${enabledSkills.length} skills loaded`);

  const tools: ToolDef[] = enabledSkills.map(s => ({
    type: "function",
    function: { name: s.id, description: s.description, parameters: { type: "object", properties: {} } },
  }));

  const messages: LLMMessage[] = [
    { role: "system", content: `You are an AI agent. Goal: ${goal}\n\nTools:\n${enabledSkills.map(s => `- ${s.id}: ${s.description}`).join("\n")}\n\nUse tools step by step.` },
  ];
  if (input) messages.push({ role: "user", content: `Input: ${JSON.stringify(input, null, 2)}` });

  let finalResponse = "";

  for (let i = 0; i < maxIterations; i++) {
    log("llm", `Iteration ${i + 1}/${maxIterations}`, "running");

    const llmResponse = await callLLM(provider, model, messages, tools, temperature, maxTokens);
    const choice = llmResponse.choices?.[0];
    if (!choice) { log("error", "No LLM response", "failed"); break; }

    const msg = choice.message as LLMMessage;
    messages.push({ role: "assistant", content: msg.content || "", tool_calls: msg.tool_calls });

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      finalResponse = msg.content || "";
      log("complete", `Finished after ${i + 1} iterations`, "completed");
      break;
    }

    for (const call of msg.tool_calls) {
      const skill = enabledSkills.find(s => s.id === call.function.name);
      if (!skill) {
        messages.push({ role: "tool", content: `Unknown skill: ${call.function.name}`, tool_call_id: call.id });
        continue;
      }
      let args: SkillInput = {};
      try { args = JSON.parse(call.function.arguments); } catch { args = { raw: call.function.arguments }; }
      log("skill", `${skill.id}(${JSON.stringify(args).slice(0, 100)})`);
      try {
        const result = await skill.execute(args, ctx as any);
        messages.push({ role: "tool", content: JSON.stringify(result.result).slice(0, 5000), tool_call_id: call.id });
      } catch (err) {
        messages.push({ role: "tool", content: `Error: ${String(err)}`, tool_call_id: call.id });
      }
    }
  }

  if (!finalResponse) finalResponse = `Completed ${maxIterations} iterations.`;
  return { output: finalResponse, logs };
}

async function callLLM(
  provider: string, model: string, messages: LLMMessage[],
  tools: ToolDef[], temperature: number, maxTokens: number,
): Promise<any> {
  const key = process.env[`${provider.toUpperCase()}_API_KEY`] || "";
  if (!key) throw new Error(`Missing API key for provider "${provider}". Set ${provider.toUpperCase()}_API_KEY.`);
  const endpoints: Record<string, string> = {
    openai: "https://api.openai.com/v1", groq: "https://api.groq.com/openai/v1",
    together: "https://api.together.xyz/v1", openrouter: "https://openrouter.ai/api/v1",
    ollama: "http://localhost:11434/v1",
  };
  const baseUrl = endpoints[provider] || "https://api.openai.com/v1";

  const body: Record<string, unknown> = { model, messages, temperature, max_tokens: maxTokens };
  if (tools.length > 0) body.tools = tools;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}
