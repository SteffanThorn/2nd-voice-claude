import { expect, test } from "@playwright/test";

// Uses the eSpeak NG voice (enabled for e2e in playwright.config.ts): it's free
// and runs inside the app, so these tests exercise real audio end to end.

test("plays a line with the selected voice and labels experimental voices", async ({ page }) => {
  await page.goto("/conversations/everyday-life/good-morning");

  const select = page.getByLabel("Voice model");
  await expect(select).toBeVisible();
  await select.selectOption({ label: "eSpeak NG · Māori rules (experimental)" });
  await expect(page.getByText(/Experimental: this isn.t a Māori voice/)).toBeVisible();

  // Watch the real <audio> element.
  await page.evaluate(() => {
    const a = document.querySelector("audio")!;
    (window as unknown as { audioLog: string[] }).audioLog = [];
    for (const ev of ["playing", "ended", "error"]) a.addEventListener(ev, () => (window as unknown as { audioLog: string[] }).audioLog.push(ev));
  });

  const audioResponse = page.waitForResponse((r) => r.url().includes("/api/tts") && r.url().includes("espeak"));
  await page.getByRole("button", { name: "Play line 1" }).click();
  const res = await audioResponse;
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("audio/wav");

  // The browser actually played it to the end, with no error shown.
  await expect.poll(() => page.evaluate(() => (window as unknown as { audioLog: string[] }).audioLog), { timeout: 15_000 }).toContain("ended");
  expect(await page.evaluate(() => (window as unknown as { audioLog: string[] }).audioLog)).not.toContain("error");
  // (Next.js adds an empty role="alert" route announcer, so check our message text instead.)
  await expect(page.getByText(/Audio couldn.t be/)).toHaveCount(0);
});

test("remembers the chosen voice model", async ({ page }) => {
  await page.goto("/conversations/everyday-life/good-morning");
  await page.getByLabel("Voice model").selectOption({ label: "eSpeak NG · Māori rules (experimental)" });
  await page.goto("/conversations/home/where-is-it");
  await expect(page.getByLabel("Voice model")).toHaveValue("espeak:mi");
});

test("play conversation moves through the lines", async ({ page }) => {
  await page.goto("/conversations/meeting-people/first-introductions");
  await page.getByLabel("Voice model").selectOption({ label: "eSpeak NG · Māori rules (experimental)" });
  const requested = new Set<string>();
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.pathname === "/api/tts") requested.add(u.searchParams.get("sentence")!);
  });
  await page.getByRole("button", { name: "▶ Play conversation" }).click();
  await expect(page.getByRole("button", { name: "■ Stop" })).toBeVisible();
  await expect.poll(() => requested.size, { timeout: 20_000 }).toBeGreaterThanOrEqual(2);
  await page.getByRole("button", { name: "■ Stop" }).click();
  await expect(page.getByRole("button", { name: "▶ Play conversation" })).toBeVisible();
});
