export function setup() {
  process.env.JWT_SECRET = "test-jwt-secret-at-least-32-characters-long!!";
  process.env.ENCRYPTION_KEY = Buffer.from("a".repeat(32)).toString("base64");
  process.env.FRONTEND_URL = "http://localhost:5173";
}
