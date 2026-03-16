// Seah Yi Xun Ryo, A0252602R
// Story A E2E: Cart flow — login → add item to cart → view in cart → remove item → assert cart empty
// Spans: Login page → HomePage → CartPage (multiple components, black-box)

import { test, expect } from '@playwright/test';

// Credentials for a test user that must exist in the database.
const TEST_USER = {
  email: 'test@test.com',
  password: '123456',
};

// Helper: log in via the login form
async function login(page) {
  await page.goto('/login');
  // Placeholders in Login.js are lowercase: "Enter your email" / "Enter your password"
  await page.getByPlaceholder('Enter your email').fill(TEST_USER.email);
  await page.getByPlaceholder('Enter your password').fill(TEST_USER.password);
  await page.getByRole('button', { name: 'LOGIN' }).click();
  // Wait for toast success or redirect — login navigates to "/" on success
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
}

// Seah Yi Xun Ryo, A0252602R
test.describe('Story A — Cart flow: add item, view in cart, remove item, assert cart empty', () => {

  test.beforeEach(async ({ page }) => {
    // Clear localStorage cart state before each test for isolation
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('cart'));
  });

  // Seah Yi Xun Ryo, A0252602R
  test('logged-in user can add a product to cart, see it in cart, remove it, and cart becomes empty', async ({ page }) => {
    // ── Step 1: Log in ──────────────────────────────────────────────────────
    await login(page);

    // ── Step 2: Navigate to home page and wait for products to load ─────────
    await page.goto('/');
    // Wait for at least one "ADD TO CART" button to be visible
    const addToCartButtons = page.getByRole('button', { name: 'ADD TO CART' });
    await expect(addToCartButtons.first()).toBeVisible({ timeout: 10000 });

    // ── Step 3: Add the first product to the cart ───────────────────────────
    // Capture the product name from the first card before clicking
    const firstCard = page.locator('.card').first();
    const productName = await firstCard.locator('.card-title').first().innerText();

    await addToCartButtons.first().click();

    // Assert toast: "Item Added to cart"
    await expect(page.getByText('Item Added to cart')).toBeVisible({ timeout: 5000 });

    // ── Step 4: Navigate to cart page ───────────────────────────────────────
    await page.goto('/cart');

    // ── Step 5: Assert the item is in the cart ──────────────────────────────
    // Cart should show item count message, not "Your Cart Is Empty"
    await expect(page.getByText(/Your Cart Is Empty/i)).not.toBeVisible();

    // Product name should appear in cart
    await expect(page.getByText(productName)).toBeVisible({ timeout: 5000 });

    // ── Step 6: Remove the item from the cart ───────────────────────────────
    await page.getByRole('button', { name: 'Remove' }).first().click();

    // ── Step 7: Assert cart is now empty ────────────────────────────────────
    await expect(page.getByText(/Your Cart Is Empty/i)).toBeVisible({ timeout: 5000 });

    // Removed product name should no longer appear in cart items
    await expect(page.getByText(productName)).not.toBeVisible();
  });

  // Seah Yi Xun Ryo, A0252602R
  test('guest user sees cart is empty and is prompted to login to checkout', async ({ page }) => {
    // Not logged in — just navigate to cart directly
    await page.goto('/cart');

    // Guest: no items, should see empty cart message
    await expect(page.getByText(/Your Cart Is Empty/i)).toBeVisible({ timeout: 5000 });

    // Guest: should see "Plase Login to checkout" button (note: typo in source)
    await expect(page.getByRole('button', { name: /login to checkout/i })).toBeVisible();
  });

});
