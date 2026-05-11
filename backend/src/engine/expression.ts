/**
 * Simple expression parser for {{ $node.NodeName.output.field }} syntax.
 * Resolves expressions against a context of node outputs.
 */

const EXPR_REGEX = /\{\{\s*\$node\.([^.]+)\.output\.([^}\s]+)\s*\}\}/g;

export function resolveExpressions(template: string, nodeOutputs: Record<string, unknown>): unknown {
  if (typeof template !== "string") return template;

  let match: RegExpExecArray | null;
  let result: string = template;

  while ((match = EXPR_REGEX.exec(template)) !== null) {
    const [full, nodeName, field] = match;
    const nodeOutput = nodeOutputs[nodeName];
    let resolved: unknown = undefined;

    if (nodeOutput && typeof nodeOutput === "object") {
      resolved = (nodeOutput as Record<string, unknown>)[field];
    }

    if (resolved !== undefined) {
      result = result.replace(full, typeof resolved === "string" ? resolved : JSON.stringify(resolved));
    }
  }

  // Try to parse as JSON if the result looks like a complete object
  try { return JSON.parse(result); } catch { return result; }
}

export function containsExpression(value: string): boolean {
  return EXPR_REGEX.test(value);
}
