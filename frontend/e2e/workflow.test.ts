import { test, expect } from "@playwright/test";

test.describe("Torque E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth and API to avoid live server dependency
    await page.route("**/api/workflows", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "test-wf-1", name: "Test WF" }) });
      }
    });
    await page.route("**/api/runs", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "run-1", status: "completed", started_at: new Date().toISOString() }]) });
    });
    await page.goto("/");
  });

  test("app loads with empty canvas state", async ({ page }) => {
    await expect(page.locator("text=n8n")).toBeVisible();
  });

  test("node creator opens on Cmd+K", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await expect(page.locator("text=Search nodes")).toBeVisible();
  });

  test("can navigate to Dashboard", async ({ page }) => {
    await page.click("text=Dashboard");
    await expect(page.locator("text=Workflows")).toBeVisible();
  });
});
