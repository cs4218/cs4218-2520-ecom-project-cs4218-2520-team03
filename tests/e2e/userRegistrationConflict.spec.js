// Sun Zihan, A0259581R
// Story: Register → Login → Logout → Re-register with same details → Registration Blocked → Re-login

import { test, expect } from '@playwright/test';

test.describe('User Registration Conflict and Identity Recovery', () => {
  let duplicateUser;

  test.beforeEach(async () => {
    const uniqueId = Date.now();
    duplicateUser = {
      name: `ConflictUser_${uniqueId}`,
      email: `conflict_${uniqueId}@test.com`,
      password: 'password123',
      phone: '87654321',
      address: '123 Testing Lane',
      answer: 'Football'
    };
  });

  test('should handle duplicate registration by displaying error and allowing subsequent login', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('Enter your name').fill(duplicateUser.name);
    await page.getByPlaceholder('Enter your email').fill(duplicateUser.email);
    await page.getByPlaceholder('Enter your password').fill(duplicateUser.password);
    await page.getByPlaceholder('Confirm your password').fill(duplicateUser.password);
    await page.getByPlaceholder('Enter your phone').fill(duplicateUser.phone);
    await page.getByPlaceholder('Enter your address').fill(duplicateUser.address);
    await page.getByPlaceholder('Enter your favorite sport').fill(duplicateUser.answer);
    await page.getByRole('button', { name: 'REGISTER' }).click();

    await expect(page).toHaveURL(/.*login/);

    await page.getByPlaceholder('Enter your email').fill(duplicateUser.email);
    await page.getByPlaceholder('Enter your password').fill(duplicateUser.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    await expect(page.locator('.navbar-nav')).toContainText(duplicateUser.name);

    await page.getByRole('button', { name: duplicateUser.name }).click();
    await page.getByRole('link', { name: 'Logout' }).click();
    
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();

    await page.goto('/register');
    await page.getByPlaceholder('Enter your name').fill(duplicateUser.name);
    await page.getByPlaceholder('Enter your email').fill(duplicateUser.email);
    await page.getByPlaceholder('Enter your password').fill(duplicateUser.password);
    await page.getByPlaceholder('Confirm your password').fill(duplicateUser.password);
    await page.getByPlaceholder('Enter your phone').fill(duplicateUser.phone);
    await page.getByPlaceholder('Enter your address').fill(duplicateUser.address);
    await page.getByPlaceholder('Enter your favorite sport').fill(duplicateUser.answer);
    await page.getByRole('button', { name: 'REGISTER' }).click();

    await expect(page.getByText(/already|exists|registered/i)).toBeVisible();

    await page.goto('/login');
    await page.getByPlaceholder('Enter your email').fill(duplicateUser.email);
    await page.getByPlaceholder('Enter your password').fill(duplicateUser.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();

    await expect(page.locator('.navbar-nav')).toContainText(duplicateUser.name);
  });
});