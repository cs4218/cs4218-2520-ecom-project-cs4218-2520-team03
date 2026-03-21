// Chen Zhiruo A0256855N
import { test, expect } from '@playwright/test';
import path from 'path';

const TEST_ADMIN = {
  email: "admin@gmail.com",
  password: "123456",
};

test("Admin update product flow", async ({ page }) => {
  const IMAGE_PATH = path.resolve(process.cwd(), "client/public/logo192.png");
  const oldCategory = 'Sports';
  const newCategory = 'Home';
  const originalName = 'Old E2E Test Update Product';
  const updatedName = 'New E2E Test Update Product';
  const updatedDescription = 'Updated through Playwright admin flow';
  const updatedPrice = '85';
  const updatedQuantity = '7';

  await test.step("Login as admin", async () => {
    await page.goto("/login");
    await page.getByPlaceholder("Enter your email").fill(TEST_ADMIN.email);
    await page.getByPlaceholder("Enter your password").fill(TEST_ADMIN.password);
    await page.getByRole("button", { name: "LOGIN" }).click();

    await expect(page).toHaveURL("http://localhost:3000/");
  });

  await test.step("Update from admin dashboard", async () => {
    await page.getByRole("button", { name: "admin" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();

    await expect(page).toHaveURL(/\/dashboard\/admin/);

    await page.getByRole("link", { name: "Products" }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/products/);

    await page.getByText(originalName, { exact: true }).click();

    await expect(
      page.getByRole("heading", { name: "Update Product" })
    ).toBeVisible();
    const nameInput = page.getByPlaceholder("write a name");
    const descInput = page.getByPlaceholder("write a description");
    await expect(nameInput).toHaveValue(originalName);

    await page.locator('input[name="photo"]').setInputFiles(IMAGE_PATH);
    await page.getByPlaceholder("write a name").fill(updatedName);
    await page.getByPlaceholder("write a description").fill(updatedDescription);
    await page.getByPlaceholder("write a Price").fill(updatedPrice);
    await page.getByPlaceholder("write a quantity").fill(updatedQuantity);

    await page.locator(".ant-select").nth(0).click();
    await page
      .locator(".ant-select-item-option")
      .getByText(newCategory, { exact: true })
      .click();

    await page.getByRole("button", { name: "UPDATE PRODUCT" }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/products/);
  });


  await test.step("Verify Updated product appears in admin product list", async () => {
    await expect(page.getByText("All Products List")).toBeVisible();
    await expect(page.getByText(updatedName)).toBeVisible();
  });

  await test.step("Verify Updated product appears in homepage and product details", async () => {
    await page.goto("/");

    const productCard = page.locator(".card").filter({ hasText: updatedName }).first();
    await expect(productCard).toBeVisible();

    await productCard.getByRole("button", { name: "More Details" }).click();

    await expect(page).toHaveURL(/\/product\//);
    await expect(page.getByText("Product Details")).toBeVisible();
    await expect(page.getByText(`Name : ${updatedName}`)).toBeVisible();
    await expect(page.getByText(`Description : ${updatedDescription}`)).toBeVisible();
    await expect(page.getByText(`Category : ${newCategory}`)).toBeVisible();
  });

  await test.step("Verify Updated product appears in search results", async () => {
    await page.goto("/");
    await page.getByPlaceholder("Search").fill(updatedName);
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(/\/search/);
    await expect(page.getByText("Search Results")).toBeVisible();
    await expect(page.getByText(updatedName)).toBeVisible();
  });

  await test.step("Verify Updated product appears under category filter", async () => {
    await page.goto("/");
    const categorySection = page.locator("div").filter({
      has: page.getByRole("heading", { name: "Filter By Category" }),
    });
    await categorySection.getByRole("checkbox", { name: newCategory }).check();
    await expect(page.getByText(updatedName)).toBeVisible();
  });

  await test.step("Verify Updated product appears under price filter", async () => {
    await page.goto("/");
    const priceFilter = page.locator("div").filter({
      has: page.getByRole("heading", { name: "Filter By Price" }),
    });
    await priceFilter.getByText("$80 to 99", { exact: true }).click();
    await expect(page.getByText(updatedName)).toBeVisible();
  });
});

