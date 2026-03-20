// Trinh Hoai Song Thu, A0266248W
const { test, expect } = require('@playwright/test');
test.describe.configure({ mode: 'serial' });
test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/login');

  await page.getByPlaceholder('Enter your email').fill('cs4218@test.com');
  await page.getByPlaceholder('Enter your password').fill('cs4218@test.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  await expect(page).toHaveURL('http://localhost:3000/');
});

test('admin should see successful order after user places an order of 1 item', async ({ page }) => {
    // 3) User places an order
  await page.getByRole('heading', { name: 'Laptop' }).click();
  await page.getByRole('button', { name: 'ADD TO CART' }).nth(3).click();
  await page.getByRole('link', { name: 'Cart' }).click();
  await page.getByRole('button', { name: 'Paying with Card' }).click();
  await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole('textbox', { name: 'Credit Card Number' }).fill('4111111111111111');
  await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole('textbox', { name: 'Expiration Date' }).fill('1228');
  await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole('textbox', { name: 'CVV' }).fill('123');
  await page.getByRole('button', { name: 'Make Payment' }).click();
  await expect(page).toHaveURL('http://localhost:3000/dashboard/user/orders');

  // 5) User logout
  await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
  await expect(page).toHaveURL('http://localhost:3000/login');

  // 6) Admin log in and check orders
  await page.goto('http://localhost:3000/login');

  await page.getByPlaceholder('Enter your email').fill('tester123@gmail.com');
  await page.getByPlaceholder('Enter your password').fill('cs4218');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await expect(page).toHaveURL('http://localhost:3000/');
  await page.getByRole('button', { name: 'Test' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Orders' }).click();
  await expect(page).toHaveURL('http://localhost:3000/dashboard/admin/orders');

  // Check if the new order is visible in the admin orders page
  await expect(page.locator('#root').getByText('Not Process').first()).toBeVisible();
  await expect(page.getByRole('cell', { name: 'CS 4218 Test Account' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Success' }).first()).toBeVisible();

  // Clean up: Admin set order status to cancel, then logout
  await page.getByText('Not Process').first().click();
  await page.getByText('cancel').nth(2).click();
  await page.getByRole('button', { name: 'Test' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
  await expect(page).toHaveURL('http://localhost:3000/login');
});

test('admin should see successful order after user places an order of multiple items', async ({ page }) => {
  test.setTimeout(60000);
  // 1) User places an order of 3 items
  await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
  await page.getByRole('button', { name: 'ADD TO CART' }).nth(1).click();
  await page.getByRole('button', { name: 'ADD TO CART' }).nth(4).click();
  await page.getByRole('link', { name: 'Cart' }).click();
  await page.getByRole('button', { name: 'Paying with Card' }).click();
  await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole('textbox', { name: 'Credit Card Number' }).fill('4111111111111111');
  await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole('textbox', { name: 'Expiration Date' }).fill('1228');
  await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole('textbox', { name: 'CVV' }).fill('123');
  await page.getByRole('button', { name: 'Make Payment' }).click();
  await expect(page).toHaveURL('http://localhost:3000/dashboard/user/orders',{ timeout: 25000 });

  // 2) User logout
  await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
  await expect(page).toHaveURL('http://localhost:3000/login');
  
  // 3) Admin log in and check orders
  await page.goto('http://localhost:3000/login');

  await page.getByPlaceholder('Enter your email').fill('tester123@gmail.com');
  await page.getByPlaceholder('Enter your password').fill('cs4218');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await expect(page).toHaveURL('http://localhost:3000/');

  // 4) Admin check order
  await page.getByRole('button', { name: 'Test' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Orders' }).click();
  await expect(page).toHaveURL('http://localhost:3000/dashboard/admin/orders');

  // Check if the new order is visible in the admin orders page
  const firstRow = page.locator('table tbody tr').first();

  await expect(firstRow).toBeVisible();
  await expect(firstRow.getByRole('cell').nth(0)).toHaveText('1');
  await expect(firstRow.getByRole('cell').nth(1)).toContainText('Not Process');
  await expect(firstRow.getByRole('cell').nth(2)).toHaveText('CS 4218 Test Account');
  await expect(firstRow.getByRole('cell').nth(3)).toContainText('a few seconds ago');
  await expect(firstRow.getByRole('cell').nth(4)).toHaveText('Success');
  await expect(firstRow.getByRole('cell').nth(5)).toHaveText('3');

  // Clean up: Admin set order status to cancel, then logout
  await page.getByText('Not Process').first().click();
  await page.getByText('cancel').nth(2).click();
  await page.getByRole('button', { name: 'Test' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
  await expect(page).toHaveURL('http://localhost:3000/login');
});

test('user should not be able to place an order with invalid card details', async ({ page }) => {
  await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
  await page.getByRole('link', { name: 'Cart' }).click();
  await page.getByRole('button', { name: 'Paying with Card' }).click();
  await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole('textbox', { name: 'Credit Card Number' }).fill('4222222222222222');
  await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole('textbox', { name: 'Expiration Date' }).fill('1228');
  await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole('textbox', { name: 'CVV' }).fill('123');
  await page.getByRole('button', { name: 'Make Payment' }).click();
  await expect(page).toHaveURL('http://localhost:3000/cart');
});
