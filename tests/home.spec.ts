import { expect, test } from "@playwright/test";
import { prisma } from "../src/lib/prisma";

test("customer home controls are clickable", async ({ page }) => {
  await prisma.otpRequest.deleteMany({ where: { phone: "9000000001" } });
  await page.goto("/");
  await page.getByRole("button", { name: /get started/i }).first().click();
  await page.locator("#auth-phone").fill("9000000001");
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.locator(".otp-grid")).toBeVisible();
  const demoText = await page.locator(".demo-pill").innerText();
  const demoCode = demoText.match(/\d{6}/)?.[0];
  expect(demoCode).toBeTruthy();
  await page.locator(".otp-grid input").first().fill(demoCode ?? "");
  await page.getByRole("button", { name: /verify/i }).click();
  await expect(page).toHaveURL(/\/home$/);

  const uploadLink = page.getByRole("link", { name: /upload prescription/i });
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  await uploadLink.scrollIntoViewIfNeeded();
  await uploadLink.click();
  await expect(page).toHaveURL(/\/upload$/);
  await page.goBack();

  await page.getByRole("link", { name: /search medicines/i }).click();
  await expect(page).toHaveURL(/\/search$/);
  await page.goBack();

  await page.getByRole("link", { name: /family members/i }).click();
  await expect(page).toHaveURL(/\/family$/);
  await page.goBack();

  await page.getByRole("link", { name: /view all/i }).click();
  await expect(page).toHaveURL(/\/orders$/);
  await page.goBack();

  await page.goto("/home");
  await page.locator(".family-chip-link").click();
  await expect(page).toHaveURL(/\/family$/);
});
