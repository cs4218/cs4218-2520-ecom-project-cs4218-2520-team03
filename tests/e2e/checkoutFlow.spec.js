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

    const addToCartButtons = page.getByRole('button', { name: 'ADD TO CART' });
    await expect(addToCartButtons.first()).toBeVisible({ timeout: 10000 });
    await addToCartButtons.first().click();
    await expect(page.getByText('Item Added to cart')).toBeVisible({ timeout: 5000 });

    await page.goto('/cart');

    await expect(page.getByText(/you have \d+ items? in your cart/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Cart Summary')).toBeVisible();
    await expect(page.getByText(/total :/i)).toBeVisible();
  });

  // Seah Yi Xun Ryo, A0252602R
  test('logged-in user can access the orders page', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/user/orders');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('All Orders')).toBeVisible({ timeout: 10000 });
  });

});
