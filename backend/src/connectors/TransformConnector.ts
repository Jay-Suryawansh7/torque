import { z } from "zod";
import { BaseConnector } from "./BaseConnector.js";
import type { IOperation, OperationOutput, ExecutionContext, ConnectionTestResult, AuthConfig } from "../core/interfaces/IConnector.js";

const setOp: IOperation = {
  id: "set",
  name: "Set Variables",
  description: "Set key-value pairs on the workflow data. Values can reference upstream outputs.",
  type: "action",
  inputSchema: z.object({ fields: z.record(z.string(), z.unknown()).default({}) }),
  outputSchema: z.object({ result: z.record(z.string(), z.unknown()) }),
  fields: [
    { id: "fields", label: "Fields", type: "json", required: true, placeholder: '{"key": "value", "name": "{{ $node.Previous.output }}"}' },
  ],
  async execute(input, _credential, _context): Promise<OperationOutput> {
    const fields = (input as any).fields || input;
    return { data: { result: { ...(typeof input === "object" ? input : {}), ...fields } } };
  },
};

const mergeOp: IOperation = {
  id: "merge",
  name: "Merge",
  description: "Merge multiple inputs into a single object or array",
  type: "action",
  inputSchema: z.object({ mode: z.enum(["combine", "overwrite", "array"]).default("combine") }),
  outputSchema: z.object({ result: z.unknown() }),
  fields: [
    { id: "mode", label: "Mode", type: "select", default: "combine",
      options: [{ label: "Combine (spread)", value: "combine" }, { label: "Overwrite", value: "overwrite" }, { label: "Wrap in Array", value: "array" }] },
  ],
  async execute(input, _credential, _context): Promise<OperationOutput> {
    return { data: { result: input } };
  },
};

export class TransformConnector extends BaseConnector {
  id = "transform";
  name = "Transform";
  description = "Set variables, merge data, and transform workflow data";
  icon = "https://cdn.simpleicons.org/transform";
  category = "utility" as const;
  authType = "none" as const;
  authConfig: AuthConfig = {};
  operations = [setOp, mergeOp];
  async testConnection(): Promise<ConnectionTestResult> { return { ok: true }; }
}
