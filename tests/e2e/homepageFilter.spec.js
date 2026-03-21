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

test.describe('Filter and loadmore flows', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('cart'));
    });

    test('user filters by category and price, then opens the product details page', async ({ page }) => {
        await login(page);

        await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

        const filtersPanel = page.locator('.filters');
        await filtersPanel.getByText('Books', { exact: true }).click();
        await filtersPanel.getByText('$0 to 19', { exact: true }).click();

        const productCard = page.locator('.card', { hasText: 'Pocket Notebook' }).first();
        await expect(productCard).toBeVisible();

        await expect(page.getByText('Wireless Mouse Alpha')).not.toBeVisible();
        await expect(page.getByText('Test Product')).not.toBeVisible();

        await productCard.getByRole('button', { name: 'More Details' }).click();

        await expect(page).toHaveURL(/\/product\/pocket-notebook/);
        await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
        await expect(page.getByText('Name : Pocket Notebook')).toBeVisible();
        await expect(page.getByText('Category : Books')).toBeVisible();
    });

    test('user applies filters, sees loadmore disappear, resets filters, then uses loadmore to continue browsing', async ({ page }) => {
        await login(page);

        const loadMoreButton = page.getByRole('button', { name: 'Loadmore' });
        await expect(loadMoreButton).toBeVisible();

        const filtersPanel = page.locator('.filters');
        await filtersPanel.getByText('Books', { exact: true }).click();

        const filteredCard = page.locator('.card', { hasText: 'Pocket Notebook' }).first();
        await expect(filteredCard).toBeVisible();
        await expect(loadMoreButton).not.toBeVisible();

        await page.getByRole('button', { name: 'RESET FILTERS' }).click();

        await expect(page).toHaveURL('/');
        await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();
        await expect(loadMoreButton).toBeVisible();

        const cardsBefore = await page.locator('.card').count();
        await loadMoreButton.click();

        await expect.poll(async () => {
            return await page.locator('.card').count();
        }).toBeGreaterThan(cardsBefore);
    });

    test('user browses the default homepage, loads more products, and opens a newly loaded product', async ({ page }) => {
        await login(page);

        await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

        const cardsBefore = await page.locator('.card').count();

        const loadMoreButton = page.getByRole('button', { name: 'Loadmore' });
        await expect(loadMoreButton).toBeVisible();
        await expect(page.getByText('Pocket Notebook')).not.toBeVisible();

        await loadMoreButton.click();
        await expect.poll(async () => {
            return await page.locator('.card').count();
        }).toBeGreaterThan(cardsBefore);
        await expect(page.getByText('Pocket Notebook')).toBeVisible();

        const productCard = page.locator('.card', { hasText: 'Pocket Notebook' }).first();
        await expect(productCard).toBeVisible();

        await productCard.getByRole('button', { name: 'More Details' }).click();

        await expect(page).toHaveURL(/\/product\/pocket-notebook/);
        await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
        await expect(page.getByText('Name : Pocket Notebook')).toBeVisible();
    });
});