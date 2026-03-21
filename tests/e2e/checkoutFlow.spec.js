// Seah Yi Xun Ryo, A0252602R
// Story B E2E: checkout flow — login → add item to cart → view cart summary → orders page accessible

import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'user@gmail.com',
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
test.describe('Story B — Checkout flow: cart summary and orders page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('cart'));
  });

  test('logged-in user with items in cart sees cart summary and total price', async ({ page }) => {
    await login(page);
    await page.goto('/');

    // Only consider cards that have "ADD TO CART" buttons (skip out-of-stock cards)
    const availableCards = page.locator('.card').filter({
      has: page.getByRole('button', { name: 'ADD TO CART' }),
    });
    await expect(availableCards.first()).toBeVisible({ timeout: 10000 });
    await availableCards.first().getByRole('button', { name: 'ADD TO CART' }).click();
    await expect(page.getByText('Item Added to cart')).toBeVisible({ timeout: 5000 });

    await page.goto('/cart');

    await expect(page.getByText(/you have \d+ items? in your cart/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Cart Summary')).toBeVisible();
    await expect(page.getByText(/total :/i)).toBeVisible();
  });

  // Seah Yi Xun Ryo, A0252602R
  test('logged-in user can access the orders page', async ({ page }) => {
    await login(page);
    // Navigate via Header dropdown (client-side React Router nav — no full page reload,
    // so auth context and axios header stay initialized, avoiding the PrivateRoute race condition)
    await page.getByRole('button', { name: /user/i }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    // PrivateRoute authCheck fires with axios header already set → ok=true quickly
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible({ timeout: 10000 });
    // Client-side nav to orders — PrivateRoute stays ok=true
    await page.getByRole('link', { name: 'Orders' }).click();
    await expect(page.getByText('All Orders')).toBeVisible({ timeout: 10000 });
  });

});
