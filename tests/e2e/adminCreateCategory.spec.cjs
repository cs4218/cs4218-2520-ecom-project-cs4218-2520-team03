// Trinh Hoai Song Thu, A0266248W
const { test, expect } = require('@playwright/test');
test.describe.configure({ mode: 'serial' });
test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/login');

  await page.getByPlaceholder('Enter your email').fill('tester123@gmail.com');
  await page.getByPlaceholder('Enter your password').fill('cs4218');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  await expect(page).toHaveURL('http://localhost:3000/');
});

test('should create a new category', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard/admin/create-category');

  await deleteCategoryIfExists(page, 'Snacks');

  await expect(page.getByRole('cell', { name: 'Snacks' })).not.toBeVisible();

  await page.getByPlaceholder('Enter new category').fill('Snacks');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByRole('cell', { name: 'Snacks' })).toBeVisible();

  await deleteCategoryIfExists(page, 'Snacks');
});

test('should show error for duplicate category', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard/admin/create-category');

  await deleteCategoryIfExists(page, 'Games');
  await createCategory(page, 'Games');

  await page.getByPlaceholder('Enter new category').fill('Games');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByRole('cell', { name: 'Games' })).toHaveCount(1);

  await deleteCategoryIfExists(page, 'Games');
});

test('should trim whitespace from category name', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard/admin/create-category');

  await page.getByPlaceholder('Enter new category').fill('  Test Whitespace  ');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('cell', { name: 'Test Whitespace', exact: true })).toBeVisible();
  await deleteCategoryIfExists(page, 'Test Whitespace');
});

test('should update an existing category', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard/admin/create-category');

  await deleteCategoryIfExists(page, 'Staionery');
  await deleteCategoryIfExists(page, 'Stationery Updated');

  await createCategory(page, 'Staionery');

  await clickEditForCategory(page, 'Staionery');

  const editDialog = page.getByRole('dialog', { name: 'Edit Category' });
  await editDialog.getByPlaceholder('Enter new category').fill('Stationery Updated');
  await editDialog.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByRole('cell', { name: 'Stationery Updated', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Staionery', exact: true })).toHaveCount(0);

  await deleteCategoryIfExists(page, 'Stationery Updated');
});

test('should delete an existing category', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard/admin/create-category');
  await deleteCategoryIfExists(page, 'Accessories');

  await createCategory(page, 'Accessories');
  await expect(page.getByRole('cell', { name: 'Accessories', exact: true })).toHaveCount(1);

  await clickDeleteForCategory(page, 'Accessories');
  await expect(page.getByRole('cell', { name: 'Accessories' })).toHaveCount(0);
});

async function createCategory(page, name) {
  await page.getByPlaceholder('Enter new category').fill(name);
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('cell', { name, exact: true })).toBeVisible();
}

function getCategoryRow(page, name) {
  return page.locator('table tbody tr').filter({
    has: page.getByRole('cell', { name, exact: true }),
  });
}

async function deleteCategoryIfExists(page, name) {
  const row = getCategoryRow(page, name);

  if (await row.count()) {
    await row.getByRole('button', { name: /delete/i }).click();

    const confirmButton = page.getByRole('button', { name: /yes|confirm|ok/i });
    if (await confirmButton.count()) {
      await confirmButton.click();
    }

    await expect(page.getByRole('cell', { name })).toHaveCount(0);
  }
}

async function clickEditForCategory(page, name) {
  const row = getCategoryRow(page, name);
  await row.getByRole('button', { name: /edit/i }).click();
}

async function clickDeleteForCategory(page, name) {
  const row = getCategoryRow(page, name);
  await row.getByRole('button', { name: /delete/i }).click();
}