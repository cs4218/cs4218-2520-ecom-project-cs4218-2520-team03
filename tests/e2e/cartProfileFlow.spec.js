// Sun Zihan, A0259581R

import { test, expect } from '@playwright/test';

async function setupUserWithCart(page, user) {
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

  await page.goto('/product/test-product');

  const productName = page.locator('.product-details-info h6').first();
  await expect(productName).not.toBeEmpty({ timeout: 10000 });

  const addToCartBtn = page.getByRole('button', { name: 'ADD TO CART' });
  await expect(addToCartBtn).toBeVisible();
  await addToCartBtn.click();
}

test.describe('Cross-Component Cart and Address Integration', () => {
  let testUser;

  test.beforeEach(async () => {
    const uniqueId = Date.now();
    testUser = {
      name: `User_${uniqueId}`,
      email: `user_${uniqueId}@test.com`,
      password: 'password123',
      phone: '91234567',
      address: '123 Initial Street'
    };
  });

  test('should successfully integrate address updates from Profile back into the Cart view', async ({ page }) => {
    const updatedAddress = "456 Integrated Boulevard, Singapore";
    await setupUserWithCart(page, testUser);

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    const cartSummary = page.locator('.cart-summary');
    await expect(cartSummary).toContainText(testUser.address);

    await page.getByRole('button', { name: 'Update Address' }).click();
    await expect(page).toHaveURL(/.*profile/);

    await page.getByPlaceholder('Enter your address').fill(updatedAddress);
    await page.getByRole('button', { name: 'UPDATE' }).click();
    await expect(page.getByText('Profile updated successfully')).toBeVisible();

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    await expect(cartSummary).toContainText(updatedAddress);
    await expect(page.locator('.cart-page')).toContainText('You Have 1 items in your cart');

    const paymentBtn = page.getByRole('button', { name: 'Make Payment' });
    await expect(paymentBtn).toBeEnabled();
  });

  test('should show validation error for empty address and prevent update', async ({ page }) => {
    await setupUserWithCart(page, testUser);
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Update Address' }).click();

    await page.getByPlaceholder('Enter your address').fill(' ');
    await page.getByRole('button', { name: 'UPDATE' }).click();
    await expect(page.getByText('Address is required')).toBeVisible();
  });
});