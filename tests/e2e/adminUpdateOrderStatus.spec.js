// Chen Zhiruo A0256855N
import { test, expect } from '@playwright/test';

const TEST_ADMIN = {
  email: 'admin@gmail.com',
  password: '123456',
};

const TEST_USER = {
  email: 'user@gmail.com',
  password: '123456',
};

const SEEDED_ORDER = {
  buyerName: 'user',
  productName: 'Expensive Laptop',
  initialStatus: 'Processing',
  updatedStatus: 'Shipped',
};

async function login(page, email, password) {
  await page.goto('/login');
  await page.getByPlaceholder('Enter your email').fill(email);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 15000,
  });
}

async function logout(page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.removeItem('auth');
    localStorage.removeItem('cart');
  });
}

test('Admin updates existing order status and user sees the update', async ({ page }) => {
  await test.step('Login as admin', async () => {
    await login(page, TEST_ADMIN.email, TEST_ADMIN.password);
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  await test.step('Admin updates seeded order status', async () => {
    await page.getByRole("button", { name: "admin" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Orders" }).click();
    await expect(page.getByText('All Orders')).toBeVisible();

    const adminOrder = page
      .locator('.border.shadow')
      .filter({ hasText: SEEDED_ORDER.buyerName })
      .filter({ hasText: SEEDED_ORDER.productName })
      .first();

    await expect(adminOrder).toBeVisible();
    await expect(adminOrder).toContainText(SEEDED_ORDER.initialStatus);

    await adminOrder.locator('.ant-select').click();
    await page
      .locator('.ant-select-item-option')
      .getByText(SEEDED_ORDER.updatedStatus, { exact: true })
      .click();

    await expect(adminOrder).toContainText(SEEDED_ORDER.updatedStatus);
  });

  await test.step('Login as user', async () => {
    await logout(page);
    await login(page, TEST_USER.email, TEST_USER.password);
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  await test.step('User sees updated order status', async () => {
    await page.getByRole("button", { name: "user" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Orders" }).click();
    await expect(page.getByText('All Orders')).toBeVisible();

    const userOrder = page
      .locator('.border.shadow')
      .filter({ hasText: SEEDED_ORDER.productName })
      .first();

    await expect(userOrder).toBeVisible();
    await expect(userOrder).toContainText(SEEDED_ORDER.updatedStatus);
  });
});