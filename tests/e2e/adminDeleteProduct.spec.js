// Chen Zhiruo A0256855N
import { test, expect } from '@playwright/test';

const TEST_ADMIN = {
  email: "admin@gmail.com",
  password: "123456",
};

test("Admin delete product flow", async ({ page }) => {
  const productName = "E2E Test Delete Product";
  const categoryName = "Electronics";

  await test.step("Login as admin", async () => {
    await page.goto("/login");
    await page.getByPlaceholder("Enter your email").fill(TEST_ADMIN.email);
    await page.getByPlaceholder("Enter your password").fill(TEST_ADMIN.password);
    await page.getByRole("button", { name: "LOGIN" }).click();

    await expect(page).toHaveURL("http://localhost:3000/");
  });

  await test.step("Delete product from admin dashboard", async () => {
    await page.getByRole("button", { name: "admin" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();

    await expect(page).toHaveURL(/\/dashboard\/admin/);

    await page.getByRole("link", { name: "Products" }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/products/);

    await page.getByText(productName, { exact: true }).click();

    await expect(
      page.getByRole("heading", { name: "Update Product" })
    ).toBeVisible();
    const nameInput = page.getByPlaceholder("write a name");
    await expect(nameInput).toHaveValue(productName);

    page.once("dialog", async (dialog) => {
      console.log("type:", dialog.type());
      console.log("message:", dialog.message());
      expect(dialog.type()).toBe("prompt");
      await dialog.accept("Yes");
    });

    await page.getByRole("button", { name: "DELETE PRODUCT" }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/products/);
  });

  await test.step("Verify deleted product no longer appears in admin product list", async () => {
    await expect(page.getByText("All Products List")).toBeVisible();
    await expect(page.getByText(productName, { exact: true })).not.toBeVisible();
  });

  await test.step("Verify deleted product no longer appears in homepage", async () => {
    await page.goto("/");

    for (let i = 0; i < 5; i++) {
      const loadMoreButton = page.getByRole("button", { name: /loadmore/i });
      if (!(await loadMoreButton.isVisible().catch(() => false))) break;
      await loadMoreButton.click();
      await page.waitForLoadState("networkidle");
    }

    await expect(page.getByText(productName, { exact: true })).not.toBeVisible();
  });

  await test.step("Verify deleted product no longer appears in search results", async () => {
    await page.goto("/");
    await page.getByPlaceholder("Search").fill(productName);
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(/\/search/);
    await expect(page.getByText(productName, { exact: true })).not.toBeVisible();
  });

  await test.step("Verify deleted product no longer appears under category filter", async () => {
    await page.goto("/");
    const categorySection = page.locator("div").filter({
      has: page.getByRole("heading", { name: "Filter By Category" }),
    });
    await categorySection.getByRole("checkbox", { name: categoryName }).check();
    await expect(page.getByText(productName, { exact: true })).not.toBeVisible();
  });

  await test.step("Verify deleted product no longer appears under price filter", async () => {
    await page.goto("/");
    const priceFilter = page.locator("div").filter({
      has: page.getByRole("heading", { name: "Filter By Price" }),
    });
    await priceFilter.getByText("$80 to 99", { exact: true }).click();

    await expect(page.getByText(productName, { exact: true })).not.toBeVisible();
  });
});