// Chen Peiran, A0257826R
import { test, expect } from '@playwright/test';

const USER = {
    email: 'user@gmail.com',
    password: '123456',
};

async function login(page) {
    await page.goto('/login');
    await page.getByPlaceholder('Enter your email').fill(USER.email);
    await page.getByPlaceholder('Enter your password').fill(USER.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await page.waitForURL((url) => url.pathname === '/', { timeout: 15000 });
}

test.describe('Search by category', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('cart'));
    });

    test('user navigates from header category dropdown to Sports category and opens product details', async ({ page }) => {
        await login(page);

        await page.getByRole('link', { name: 'Categories' }).click();
        await page.getByTestId('header-category-link-sports').click();

        await expect(page).toHaveURL(/\/category\/sports/);
        await expect(page.getByText('Category - Sports')).toBeVisible();

        const productCard = page.locator('.card', { hasText: 'Test Product' }).first();
        await expect(productCard).toBeVisible();

        await productCard.getByRole('button', { name: 'More Details' }).click();

        await expect(page).toHaveURL(/\/product\/test-product/);
        await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
        await expect(page.getByText('Name : Test Product')).toBeVisible();
        await expect(page.getByText('Category : Sports')).toBeVisible();
    });

    test('user opens All Categories from the dropdown, clicks Books, and reaches a book product details page', async ({ page }) => {
        await login(page);

        await page.getByRole('link', { name: 'Categories' }).click();
        await page.getByRole('link', { name: 'All Categories' }).click();

        await expect(page).toHaveURL(/\/categories/);

        await page.getByRole('link', { name: 'Books' }).click();

        await expect(page).toHaveURL(/\/category\/books/);
        await expect(page.getByText('Category - Books')).toBeVisible();

        const productCard = page.locator('.card', { hasText: 'Pocket Notebook' }).first();
        await expect(productCard).toBeVisible();

        await productCard.getByRole('button', { name: 'More Details' }).click();

        await expect(page).toHaveURL(/\/product\/pocket-notebook/);
        await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
        await expect(page.getByText('Name : Pocket Notebook')).toBeVisible();
        await expect(page.getByText('Category : Books')).toBeVisible();
    });
});