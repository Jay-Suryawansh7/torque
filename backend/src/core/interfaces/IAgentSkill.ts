import type { ZodSchema } from "zod";
import type { ExecutionContext } from "./IConnector.js";

export interface SkillInput {
  [key: string]: unknown;
}

export interface SkillOutput {
  result: unknown;
  error?: string;
}

export interface IAgentSkill {
  id: string;
  name: string;
  description: string;
  inputSchema: ZodSchema;
  outputSchema: ZodSchema;
  execute(input: SkillInput, context: ExecutionContext): Promise<SkillOutput>;
}
