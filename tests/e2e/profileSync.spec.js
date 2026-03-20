// Sun Zihan, A0259581R
// Story: Login -> Dashboard -> Update Profile -> Dashboard -> Verify Changes

import { test, expect } from '@playwright/test';

async function registerAndLogin(page, user) {
  await page.goto('/register');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByPlaceholder('Enter your name').fill(user.name);
  await page.getByPlaceholder('Enter your email').fill(user.email);
  await page.getByPlaceholder('Enter your password').fill(user.password);
  await page.getByPlaceholder('Confirm your password').fill(user.password);
  await page.getByPlaceholder('Enter your phone').fill(user.phone);
  await page.getByPlaceholder('Enter your address').fill(user.address);
  await page.getByPlaceholder('Enter your favorite sport').fill('Football');
  
  await page.getByRole('button', { name: 'REGISTER' }).click();
  await expect(page).toHaveURL(/.*login/);

  await page.getByPlaceholder('Enter your email').fill(user.email);
  await page.getByPlaceholder('Enter your password').fill(user.password);
  await page.getByRole('button', { name: 'LOGIN' }).click();
  
  await expect(page.locator('.navbar-nav')).toContainText(user.name);
}

test.describe('Dashboard and Profile Synchronization Lifecycle', () => {
  let currentTestUser;

  test.beforeEach(async ({ page }) => {
    const uniqueId = Date.now();
    currentTestUser = {
      name: `SyncUser_${uniqueId}`,
      email: `sync_${uniqueId}@test.com`,
      password: 'password123',
      phone: '87654321',
      address: '123 Testing Lane'
    };
    await registerAndLogin(page, currentTestUser);
  });

  test('should successfully update name/address and reflect changes in header and dashboard', async ({ page }) => {
    const updatedName = "UPDATED NAME";
    const updatedAddress = "456 Updated Boulevard";

    await page.getByText(currentTestUser.name).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    
    await page.locator('.list-group-item', { hasText: 'Profile' }).click();

    await page.getByPlaceholder('Enter your name').fill(updatedName);
    await page.getByPlaceholder('Enter your address').fill(updatedAddress);
    await page.getByRole('button', { name: 'UPDATE' }).click();

    await expect(page.getByText('Profile updated successfully')).toBeVisible();

    await expect(page.locator('.navbar-nav')).toContainText(updatedName);

    await page.getByText(updatedName).click(); 
    await page.getByRole('link', { name: 'Dashboard' }).click();
    
    const dashboardCard = page.locator('.dashboard .card');
    await expect(dashboardCard).toBeVisible();
    await expect(dashboardCard).toContainText(updatedName);
    await expect(dashboardCard).toContainText(updatedAddress);
    await expect(dashboardCard).toContainText(currentTestUser.email);
  });

  test('should display validation error for empty address', async ({ page }) => {
    await page.getByText(currentTestUser.name).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.locator('.list-group-item', { hasText: 'Profile' }).click();
    
    await page.getByPlaceholder('Enter your address').fill(' '); 
    await page.getByRole('button', { name: 'UPDATE' }).click();

    await expect(page.getByText('Address is required')).toBeVisible();
  });
});