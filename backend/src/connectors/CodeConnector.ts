import { z } from "zod";
import vm from "vm";
import { BaseConnector } from "./BaseConnector.js";
import type { IOperation, OperationOutput, ExecutionContext, ConnectionTestResult, AuthConfig } from "../core/interfaces/IConnector.js";

const inputSchema = z.object({
  language: z.enum(["javascript", "python", "typescript"]).default("javascript"),
  code: z.string().min(1),
  timeout: z.number().min(100).max(30000).default(10000),
});

const outputSchema = z.object({
  result: z.unknown(),
  stdout: z.string(),
  error: z.string().optional(),
});

const runCodeOp: IOperation = {
  id: "run_javascript",
  name: "Run JavaScript",
  description: "Execute JavaScript code in a sandboxed environment. The input data is available as `$input`.",
  type: "action",
  inputSchema,
  outputSchema,
  fields: [
    { id: "language", label: "Language", type: "select", required: true, default: "javascript",
      options: [{ label: "JavaScript", value: "javascript" }, { label: "TypeScript", value: "typescript" }] },
    { id: "code", label: "Code", type: "code", required: true, placeholder: "return $input.data.map(x => x * 2);" },
    { id: "timeout", label: "Timeout (ms)", type: "number", default: 10000 },
  ],
  async execute(input, _credential, context): Promise<OperationOutput> {
    const parsed = inputSchema.parse(input);
    const sandbox = vm.createContext({
      $input: input,
      $context: context,
      console: { log: (...args: unknown[]) => args },
      require: undefined,
      process: undefined,
      globalThis: undefined,
      setTimeout: undefined,
      setInterval: undefined,
      clearTimeout: undefined,
      clearInterval: undefined,
      fetch: undefined,
      __proto__: undefined,
    });
    const script = new vm.Script(`"use strict";\n${parsed.code}`, { filename: "code-node.js" });
    try {
      const result = script.runInContext(sandbox, { timeout: parsed.timeout, breakOnSigint: true });
      return { data: { result, stdout: "" } };
    } catch (err) {
      return { data: { result: null, stdout: "" }, error: String(err) };
    }
  },
};

export class CodeConnector extends BaseConnector {
  id = "code";
  name = "Code";
  description = "Execute JavaScript/TypeScript code in a sandboxed environment";
  icon = "https://cdn.simpleicons.org/javascript";
  category = "utility" as const;
  authType = "none" as const;
  authConfig: AuthConfig = {};
  operations = [runCodeOp];
  async testConnection(): Promise<ConnectionTestResult> { return { ok: true }; }
}
