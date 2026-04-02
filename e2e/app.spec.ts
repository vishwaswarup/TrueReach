import { test, expect } from "@playwright/test";

test("hackathon demo flow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Start New Campaign")).toBeVisible();
  await page.getByPlaceholder("@username").fill("raj_fitness");
  await page.getByLabel("Campaign Budget").fill("50000");
  await page.getByRole("button", { name: "Analyze Campaign" }).click();

  await expect(page.getByText("Authenticity Score")).toBeVisible();
  await expect(page.getByText("@RAJ_FITNESS")).toBeVisible();
  await expect(page.getByText(/OVERPRICED BY/i)).toBeVisible();

  await page.getByRole("button", { name: "Lock Escrow Payment" }).click();
  await expect(page.getByText(/ID: CAMP/i)).toBeVisible();

  await page.getByRole("button", { name: /Simulate Engagement/i }).click();

  await page.getByRole("button", { name: "Release Escrow Payment" }).click();
  await expect(page.getByText("Payment Released")).toBeVisible();
});
