// Seah Yi Xun Ryo, A0252602R
// Story A E2E: login → add to cart → view cart → remove item → assert empty

import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'test@test.com',
  password: '123456',
};

async function login(page) {
  await page.goto('/login');
  await page.getByPlaceholder('Enter your email').fill(TEST_USER.email);
  await page.getByPlaceholder('Enter your password').fill(TEST_USER.password);
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
}

// Seah Yi Xun Ryo, A0252602R
test.describe('Story A — Cart flow: add item, view in cart, remove item, assert cart empty', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('cart'));
  });

  // Seah Yi Xun Ryo, A0252602R
  test('logged-in user can add a product to cart, see it in cart, remove it, and cart becomes empty', async ({ page }) => {
    await login(page);
    await page.goto('/');

    const addToCartButtons = page.getByRole('button', { name: 'ADD TO CART' });
    await expect(addToCartButtons.first()).toBeVisible({ timeout: 10000 });

    const firstCard = page.locator('.card').first();
    const productName = await firstCard.locator('.card-title').first().innerText();

    await addToCartButtons.first().click();
    await expect(page.getByText('Item Added to cart')).toBeVisible({ timeout: 5000 });

    await page.goto('/cart');
    await expect(page.getByText(/Your Cart Is Empty/i)).not.toBeVisible();
    await expect(page.getByText(productName)).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Remove' }).first().click();

    await expect(page.getByText(/Your Cart Is Empty/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(productName)).not.toBeVisible();
  });

  // Seah Yi Xun Ryo, A0252602R
  test('guest user sees cart is empty and is prompted to login to checkout', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.getByText(/Your Cart Is Empty/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /login to checkout/i })).toBeVisible();
  });

});
