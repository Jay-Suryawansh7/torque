import { describe, it, expect } from "vitest";

// Inline the validateUrl logic directly for standalone testing
const BLOCKED_HOSTS = /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.0\.0\.0|localhost|::1)/i;

function validateUrl(url: string): string {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("Only http/https allowed");
  if (BLOCKED_HOSTS.test(parsed.hostname)) throw new Error(`Blocked internal host: ${parsed.hostname}`);
  if (["localhost", "127.0.0.1", "::1", "0.0.0.0"].includes(parsed.hostname)) throw new Error("Blocked localhost/loopback");
  return url;
}

describe("MCP validateUrl", () => {
  const blocked: [string, string][] = [
    ["127.0.0.1", "loopback IPv4"],
    ["127.0.0.2", "loopback range"],
    ["10.0.0.1", "private 10.x"],
    ["10.255.255.255", "private 10.x max"],
    ["172.16.0.1", "private 172.16"],
    ["172.31.255.255", "private 172.31"],
    ["192.168.0.1", "private 192.168"],
    ["192.168.255.255", "private 192.168"],
    ["localhost", "hostname localhost"],
    ["::1", "IPv6 loopback"],
    ["0.0.0.0", "unspecified"],
  ];

  for (const [host, desc] of blocked) {
    it(`blocks ${desc} (${host})`, () => {
      expect(() => validateUrl(`http://${host}/tools/list`)).toThrow();
      expect(() => validateUrl(`https://${host}/tools/list`)).toThrow();
    });
  }

  it("allows valid public HTTPS URLs", () => {
    expect(validateUrl("https://api.github.com/tools/list")).toBe("https://api.github.com/tools/list");
  });

  it("allows valid public HTTP URLs", () => {
    expect(validateUrl("http://example.com/data")).toBe("http://example.com/data");
  });

  it("rejects non-http schemes", () => {
    expect(() => validateUrl("file:///etc/passwd")).toThrow();
    expect(() => validateUrl("ftp://example.com/file")).toThrow();
    expect(() => validateUrl("gopher://example.com/")).toThrow();
  });

  it("rejects invalid URLs", () => {
    expect(() => validateUrl("not-a-url")).toThrow();
  });

  it("blocks internal IP with port", () => {
    expect(() => validateUrl("https://127.0.0.1:8080/tools")).toThrow();
    expect(() => validateUrl("https://10.0.0.5:5432/query")).toThrow();
  });
});
