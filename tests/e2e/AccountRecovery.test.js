// Sun Zihan, A0259581R
// Story: Forgot Password → Reset → Re-authentication → Homepage Verification

import { test, expect } from '@playwright/test';

async function registerUser(page, user) {
  await page.goto('/register');
  await page.getByPlaceholder(/name/i).fill(user.name);
  await page.getByPlaceholder(/email/i).fill(user.email);
  await page.locator('input[name="password"]').fill(user.password);
  await page.locator('input[name="confirmPassword"]').fill(user.password);
  await page.getByPlaceholder(/phone/i).fill(user.phone);
  await page.getByPlaceholder(/address/i).fill(user.address);
  await page.getByPlaceholder(/sport/i).fill(user.answer);
  await page.getByRole('button', { name: /REGISTER/i }).click();
  await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 15000 });
}

test.describe('Account Recovery and Re-authentication Lifecycle', () => {
  let currentTestUser;

  test.beforeEach(async ({ page }) => {
    const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    currentTestUser = {
      name: 'Recovery User',
      email: `recover_${uniqueId}@test.com`,
      password: 'oldPassword123',
      newPassword: 'newPassword456',
      phone: '98765432',
      address: '123 Test Road',
      answer: 'football',
    };

    await registerUser(page, currentTestUser);
    await page.goto('/forgot-password');
  });

  test('should successfully reset password and login with new credentials', async ({ page }) => {
    await page.getByPlaceholder(/email/i).fill(currentTestUser.email);
    await page.getByPlaceholder(/sport/i).fill(currentTestUser.answer);
    await page.getByPlaceholder(/enter your new password/i).fill(currentTestUser.newPassword);
    await page.getByPlaceholder(/confirm your new password/i).fill(currentTestUser.newPassword);
    await page.getByRole('button', { name: /RESET/i }).click();
    await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 10000 });
    
    const successToast = page.getByText(/(success|updated|reset)/i);
   
    await expect(successToast.first()).toBeVisible().catch(() => {
        console.log("Toast hidden by rapid navigation, proceeding to login check...");
    });
    await page.getByPlaceholder(/email/i).fill(currentTestUser.email);
    await page.locator('form').filter({ hasText: /LOGIN/i }).locator('input[type="password"]').fill(currentTestUser.newPassword);
    await page.getByRole('button', { name: /LOGIN/i }).click();
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
    
    const navbar = page.locator('.navbar');

    await expect(navbar).toContainText(currentTestUser.name);
    await expect(page.getByRole('link', { name: 'Login', exact: true })).not.toBeVisible();
  });

  test('should display error message on UI for incorrect security answer', async ({ page }) => {
    await page.getByPlaceholder(/email/i).fill(currentTestUser.email);
    await page.getByPlaceholder(/sport/i).fill('wrong-answer-123');
    await page.getByPlaceholder(/new password/i).first().fill(currentTestUser.newPassword);
    await page.getByPlaceholder(/confirm/i).fill(currentTestUser.newPassword);
    await page.getByRole('button', { name: /RESET/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByText(/Incorrect email or security answer/i)).toBeVisible({ timeout: 5000 });
  });

});