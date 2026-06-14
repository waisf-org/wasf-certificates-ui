import { test, expect } from '@playwright/test';
import { urls, uniqueName, createBadge } from '../helpers/badge';
import path from 'path';

test('issues a badge individually by email', async ({ page }) => {
	const badgeSlug = await createBadge(page, 'participation', uniqueName('Issue-Individual'));

	await page.goto(urls.badgeIssue(badgeSlug));

	await page.locator('oeb-input').first().locator('input').fill('Test Recipient');
	await page.locator('input[type="email"]').fill('test-recipient@example.com');

	await page.locator('#issue-badge-btn').click();

	await page.waitForURL(/\/badges\/[^/?#]+/, { timeout: 30_000 });
	await expect(page).toHaveURL(/\/badges\/[^/?#]+/);
});

test('issues badges via bulk CSV import', async ({ page }) => {
	const badgeSlug = await createBadge(page, 'participation', uniqueName('Issue-Bulk'));

	await page.goto(urls.badgeBulk(badgeSlug));

	const csvPath = path.join(__dirname, '..', 'fixtures', 'bulk-import.csv');
	await page.locator('input[type="file"]').setInputFiles(csvPath);
	await page.waitForTimeout(1000); // wait for file to be read into rawCsv

	// import → preview
	await page.locator('#bulk-import-btn').click();

	// preview → confirmation (column mapping step)
	await page.locator('#bulk-preview-btn').waitFor({ state: 'visible', timeout: 10_000 });
	await page.locator('#bulk-preview-btn').click();

	// confirmation
	await page.locator('#bulk-confirm-btn').waitFor({ state: 'visible', timeout: 10_000 });
	await page.locator('#bulk-confirm-btn').click();

	await page.waitForURL(/\/badges\/[^/?#]+/, { timeout: 30_000 });
	await expect(page).toHaveURL(/\/badges\/[^/?#]+/);
});

test('creates a QR code award', async ({ page }) => {
	const badgeSlug = await createBadge(page, 'participation', uniqueName('Issue-QR'));

	await page.goto(urls.badgeQr(badgeSlug));

	await page.locator('oeb-input').nth(0).locator('input').fill('E2E QR Code Test');
	await page.locator('oeb-input').nth(1).locator('input').fill('E2E Test Runner');

	await page.locator('#qr-generate-btn').click();

	await page.waitForURL(/\/qr\/.+\/generate/, { timeout: 30_000 });
	await expect(page).toHaveURL(/\/qr\/.+\/generate/);
});
