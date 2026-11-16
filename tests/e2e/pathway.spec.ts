import { expect, test } from "@playwright/test";

// Each test gets a fresh browser profile, so progress always starts empty.

test("topics page shows every topic with progress and stats", async ({ page }) => {
  await page.goto("/conversations");
  await expect(page.getByRole("heading", { name: "Conversations", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /Everyday life/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Social situations/ })).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveCount(14);
  await expect(page.getByText("0/3").first()).toBeVisible();
});

test("levels unlock in order, award XP, and only within their own topic", async ({ page }) => {
  await page.goto("/conversations/home");

  // Fresh start: level 1 open, levels 2 and 3 locked.
  await expect(page.getByRole("link", { name: /Where is it\?/ })).toBeVisible();
  await expect(page.getByText("Complete level 1 to unlock")).toBeVisible();
  await expect(page.getByRole("link", { name: /Tidying up/ })).toHaveCount(0);

  // Opening level 2 directly shows the lock screen.
  await page.goto("/conversations/home/tidying-up");
  await expect(page.getByRole("heading", { name: "This level is locked" })).toBeVisible();
  await page.getByRole("link", { name: /Go to level 1/ }).click();

  // Level 1: every line is labelled with its AI origin and confidence.
  await expect(page.getByRole("heading", { name: /Where is it\?/ })).toBeVisible();
  await expect(page.getByText(/AI-created with \d+% confidence of language logic/)).toHaveCount(7);

  // Translations are hidden until asked for.
  await expect(page.getByText("Where is my book?")).toHaveCount(0);
  await page.getByRole("button", { name: "Show English" }).first().click();
  await expect(page.getByText("Where is my book?")).toBeVisible();
  await page.getByRole("button", { name: "Show all translations" }).click();
  await expect(page.getByText("Okay, I'll wash them.")).toBeVisible();

  // Complete the level → celebration, XP, next level link.
  await page.getByRole("button", { name: /Complete level · ⚡ \+55 XP/ }).click();
  await expect(page.getByRole("heading", { name: /Level complete/ })).toBeVisible();
  await expect(page.getByText(/1-day streak/)).toBeVisible();
  await page.getByRole("link", { name: /Next: Level 2, Tidying up/ }).click();

  // Level 2 is now open.
  await expect(page.getByRole("heading", { name: /Tidying up/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "This level is locked" })).toHaveCount(0);

  // Topic page reflects progress; level 3 still locked.
  await page.goto("/conversations/home");
  await expect(page.getByText(/1 of 3 levels · ⚡ 55\//)).toBeVisible();
  await expect(page.getByText("Complete level 2 to unlock")).toBeVisible();

  // Another topic is unaffected.
  await page.goto("/conversations/work");
  await expect(page.getByText("Complete level 1 to unlock")).toBeVisible();

  // Overall stats.
  await page.goto("/conversations");
  await expect(page.getByText("1/3")).toBeVisible();
  await expect(page.getByText("55", { exact: true })).toBeVisible();
});

test("completing a level twice doesn't award XP twice", async ({ page }) => {
  await page.goto("/conversations/travel/where-to");
  await page.getByRole("button", { name: /Complete level/ }).click();
  await page.reload();
  await expect(page.getByText(/Completed\. Practise it as often as you like/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Complete level/ })).toHaveCount(0);
});

test("page has no horizontal scroll", async ({ page }) => {
  for (const path of ["/conversations", "/conversations/family", "/conversations/family/my-family"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
