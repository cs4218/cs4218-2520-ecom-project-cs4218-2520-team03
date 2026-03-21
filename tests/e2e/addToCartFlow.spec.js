// Seah Yi Xun Ryo, A0252602R
// Story D E2E: login → add two products from HomePage → verify both appear in CartPage

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
test.describe('Story D — Add two products to cart and verify both in CartPage', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('cart'));
  });

  test('logged-in user can add two products to cart and both appear in cart', async ({ page }) => {
    await login(page);
    await page.goto('/');

    const availableCards = page.locator('.card').filter({
      has: page.getByRole('button', { name: 'ADD TO CART' }),
    });
    await expect(availableCards.nth(0)).toBeVisible({ timeout: 10000 });

    const firstName = await availableCards.nth(0).locator('.card-title').first().innerText();
    const secondName = await availableCards.nth(1).locator('.card-title').first().innerText();

    // Add both to cart using their specific card buttons
    await availableCards.nth(0).getByRole('button', { name: 'ADD TO CART' }).click();
    await expect(page.getByText('Item Added to cart').first()).toBeVisible({ timeout: 5000 });

    await availableCards.nth(1).getByRole('button', { name: 'ADD TO CART' }).click();
    await expect(page.getByText('Item Added to cart').first()).toBeVisible({ timeout: 5000 });

    await page.goto('/cart');

    await expect(page.getByText(firstName)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(secondName)).toBeVisible({ timeout: 5000 });

    // Cart should show 2 items
    await expect(page.getByText(/you have 2 items? in your cart/i)).toBeVisible({ timeout: 5000 });
  });

});
