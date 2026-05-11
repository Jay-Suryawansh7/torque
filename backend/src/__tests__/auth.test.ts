import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { authRouter } from "../auth";
import { workflowsRouter } from "../api/workflows";

const app = express();
app.use(express.json());
app.use("/api/auth", authRouter());
app.use("/api", workflowsRouter("/tmp"));

describe("Auth", () => {
  it("register creates user and returns 201", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "new@test.com", password: "password123" });
    expect(res.status).toBe(201);
  });

  it("register with duplicate email returns 409", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "new@test.com", password: "password123" });
    expect(res.status).toBe(409);
  });

  it("login with wrong password returns 401", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "new@test.com", password: "wrongpass" });
    expect(res.status).toBe(401);
  });

  it("login with correct password returns access token", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "new@test.com", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
  });

  it("protected routes without JWT return 401", async () => {
    const res = await request(app).get("/api/workflows");
    expect(res.status).toBe(401);
  });

  it("protected routes with valid JWT return 200", async () => {
    const login = await request(app).post("/api/auth/login").send({ email: "new@test.com", password: "password123" });
    const token = login.body.accessToken;
    const res = await request(app).get("/api/workflows").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("refresh token rotation revokes old token", async () => {
    const login = await request(app).post("/api/auth/login").send({ email: "new@test.com", password: "password123" });
    const oldRefresh = login.body.refreshToken;

    // Use refresh token to get new tokens
    const refresh1 = await request(app).post("/api/auth/refresh").send({ refreshToken: oldRefresh });
    expect(refresh1.status).toBe(200);
    const newRefresh = refresh1.body.refreshToken;

    // Old refresh token should now be revoked
    const refresh2 = await request(app).post("/api/auth/refresh").send({ refreshToken: oldRefresh });
    expect(refresh2.status).toBe(401);
    expect(refresh2.body.error).toBe("Invalid or expired refresh token");

    // New refresh token should still work
    const refresh3 = await request(app).post("/api/auth/refresh").send({ refreshToken: newRefresh });
    expect(refresh3.status).toBe(200);
  });

  it("logout revokes refresh token", async () => {
    const login = await request(app).post("/api/auth/login").send({ email: "new@test.com", password: "password123" });
    const rt = login.body.refreshToken;
    await request(app).post("/api/auth/logout").send({ refreshToken: rt });
    const res = await request(app).post("/api/auth/refresh").send({ refreshToken: rt });
    expect(res.status).toBe(401);
  });
});
