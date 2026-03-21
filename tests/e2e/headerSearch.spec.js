// Chen Peiran, A0257826R
import { test, expect } from '@playwright/test';

const USER = {
  email: 'user@gmail.com',
  password: '123456',
};

async function login(page) {
  await page.goto('/login');
  await page.getByPlaceholder('Enter your email').fill(USER.email);
  await page.getByPlaceholder('Enter your password').fill(USER.password);
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.waitForURL((url) => url.pathname === '/', { timeout: 15000 });
}

test.describe('Header search flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('cart'));
  });

  test('user searches for a product, views its details, and adds it to cart', async ({ page }) => {
    await login(page);

    await page.getByPlaceholder('Search').fill('Wireless Mouse');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page).toHaveURL(/\/search/);
    await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();

    const resultCard = page.locator('.card', { hasText: 'Wireless Mouse Alpha' }).first();
    await expect(resultCard).toBeVisible();

    await resultCard.getByRole('button', { name: 'More Details' }).click();

    await expect(page).toHaveURL(/\/product\/wireless-mouse-alpha/);
    await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
    await expect(page.getByText(/Name : Wireless Mouse Alpha/i)).toBeVisible();
    await expect(page.getByText(/Category : Electronics/i)).toBeVisible();

    const productDetailsSection = page.locator('.product-details-info');
    await productDetailsSection.getByRole('button', { name: 'ADD TO CART' }).click();

    await expect(page.getByText('Item Added to cart')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.ant-badge-count')).toHaveText('1');
  });

  test('user searches for a product and adds it to cart directly from search results', async ({ page }) => {
    await login(page);

    await page.getByPlaceholder('Search').fill('Notebook');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page).toHaveURL(/\/search/);
    await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();

    const resultCard = page.locator('.card', { hasText: 'Pocket Notebook' }).first();
    await expect(resultCard).toBeVisible();

    await resultCard.getByRole('button', { name: 'ADD TO CART' }).click();

    await expect(page.getByText('Item Added to cart')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.ant-badge-count')).toHaveText('1');
  });
});