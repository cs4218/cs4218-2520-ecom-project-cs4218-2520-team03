// Sun Zihan, A0259581R
// Story: Attempt Re-registration with seeded details → Registration Blocked → Re-login

import { test, expect } from '@playwright/test';

const SEEDED_USER = {
  email: "user@gmail.com",
  password: "123456",
  name: "user",
  phone: "12345678",
  address: "123",
  answer: "123"
};

test.describe('User Registration Conflict and Identity Recovery', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should handle duplicate registration by displaying error and allowing subsequent login', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Enter your email').fill(SEEDED_USER.email);
    await page.getByPlaceholder('Enter your password').fill(SEEDED_USER.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    await expect(page.locator('.navbar-nav')).toContainText(SEEDED_USER.name);

    await page.getByRole('button', { name: SEEDED_USER.name, exact: false }).click();
    await page.getByRole('link', { name: 'Logout' }).click();
    
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();

    await page.goto('/register');
    await page.getByPlaceholder('Enter your name').fill(SEEDED_USER.name);
    await page.getByPlaceholder('Enter your email').fill(SEEDED_USER.email);
    await page.getByPlaceholder('Enter your password').fill(SEEDED_USER.password);
    await page.getByPlaceholder('Confirm your password').fill(SEEDED_USER.password);
    await page.getByPlaceholder('Enter your phone').fill(SEEDED_USER.phone);
    await page.getByPlaceholder('Enter your address').fill(SEEDED_USER.address);
    await page.getByPlaceholder('Enter your favorite sport').fill(SEEDED_USER.answer);
    await page.getByRole('button', { name: 'REGISTER' }).click();

    await expect(page.getByText(/already|exists|registered/i)).toBeVisible();

    await page.goto('/login');
    await page.getByPlaceholder('Enter your email').fill(SEEDED_USER.email);
    await page.getByPlaceholder('Enter your password').fill(SEEDED_USER.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();

    await expect(page.locator('.navbar-nav')).toContainText(SEEDED_USER.name);
  });
});