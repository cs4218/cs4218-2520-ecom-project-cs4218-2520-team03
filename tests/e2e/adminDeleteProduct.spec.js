// Chen Zhiruo A0256855N

import { test, expect } from '@playwright/test';
import path from 'path';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@test.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || '123456';
const IMAGE_PATH = path.resolve(process.cwd(), 'client/public/logo192.png');

let categoryName;
let productName;

test.beforeEach(async ({ page }) => {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  categoryName = `E2E Delete Category ${stamp}`;
  productName = `E2E Delete Product ${stamp}`;

  await page.goto('/');
  await page.evaluate(() => {
    localStorage.removeItem('auth');
    localStorage.removeItem('cart');
  });

  await page.goto('/login');
  await page.getByPlaceholder('Enter your email').fill(ADMIN_EMAIL);
  await page.getByPlaceholder('Enter your password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 15000,
  });

  await page.goto('/dashboard/admin/create-category');
  await page.getByPlaceholder('Enter new category').fill(categoryName);
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText(categoryName)).toBeVisible({ timeout: 10000 });

  await page.goto('/dashboard/admin/create-product');

  await page.locator('.ant-select').nth(0).click();
  await page
    .locator('.ant-select-item-option')
    .getByText(categoryName, { exact: true })
    .click();

  await page.locator('input[name="photo"]').setInputFiles(IMAGE_PATH);
  await page.getByPlaceholder('write a name').fill(productName);
  await page.getByPlaceholder('write a description').fill('This product will be deleted');
  await page.getByPlaceholder('write a Price').fill('85');
  await page.getByPlaceholder('write a quantity').fill('4');

  await page.locator('.ant-select').nth(1).click();
  await page
    .locator('.ant-select-item-option')
    .getByText('Yes', { exact: true })
    .click();

  await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
  await page.waitForURL('**/dashboard/admin/products', { timeout: 15000 });

  await page.getByText(productName).click();
  await expect(page.getByText('Update Product')).toBeVisible();

  page.on('dialog', async (dialog) => {
    await dialog.accept('Yes');
  });

  await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();
  await page.waitForURL('**/dashboard/admin/products', { timeout: 15000 });
});

test.describe('Admin Delete Product', () => {
  test('full flow: admin deletes a product and it no longer appears in dashboard or homepage', async ({ page }) => {
    await expect(page.getByText(productName)).not.toBeVisible();

    await page.goto('/');
    for (let i = 0; i < 5; i++) {
      const loadMoreButton = page.getByRole('button', { name: /loadmore/i });
      if (!(await loadMoreButton.isVisible().catch(() => false))) break;
      await loadMoreButton.click();
      await page.waitForLoadState('networkidle');
    }

    await expect(page.getByText(productName)).not.toBeVisible();
  });

  test('deleted product does not appear in search results', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Search').fill(productName);
    await page.getByRole('button', { name: 'Search' }).click();

    await page.waitForURL('**/search', { timeout: 10000 });
    await expect(page.getByText(productName)).not.toBeVisible();
  });

  test('deleted product does not appear under category filter', async ({ page }) => {
    await page.goto('/');
    await page.getByText(categoryName, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(productName)).not.toBeVisible();
  });

  test('deleted product does not appear under price filter', async ({ page }) => {
    await page.goto('/');
    await page.getByText('$80 to 99', { exact: true }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(productName)).not.toBeVisible();
  });
});