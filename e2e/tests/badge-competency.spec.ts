import { test, expect } from '@playwright/test';
import { urls, uniqueName, createBadge } from '../helpers/badge';
import path from 'path';

test('creates a competency badge and issues it via bulk CSV', async ({ page }) => {
	const badgeSlug = await createBadge(page, 'competency', uniqueName('Competency-Bulk'));

	await page.goto(urls.badgeBulk(badgeSlug));

	const csvPath = path.join(__dirname, '..', 'fixtures', 'bulk-import.csv');
	await page.locator('input[type="file"]').setInputFiles(csvPath);
	await page.locator('#bulk-import-btn:not(.button-is-disabled)').waitFor({ state: 'visible', timeout: 10_000 });

	await page.locator('#bulk-import-btn').click();
	await page.locator('#bulk-preview-btn').waitFor({ state: 'visible', timeout: 10_000 });
	await page.locator('#bulk-preview-btn').click();
	await page.locator('#bulk-confirm-btn').waitFor({ state: 'visible', timeout: 10_000 });
	await page.locator('#bulk-confirm-btn').click();

	await page.waitForURL(/\/badges\/[^/?#]+/, { timeout: 30_000 });
	await expect(page.getByTestId('badge-title')).toBeVisible();
});

test('creates a competency badge and issues it with a PDF template', async ({ page }) => {
	const badgeSlug = await createBadge(page, 'competency', uniqueName('Competency-PDF'));

	await page.goto(urls.badgeIssue(badgeSlug));

	const pdfLabel = page.getByText('PDF-Hintergrund');
	if (await pdfLabel.isVisible({ timeout: 5_000 }).catch(() => false)) {
		await page.locator('oeb-select').filter({ has: pdfLabel }).locator('hlm-select-trigger').click();
		await page.locator('hlm-option').first().waitFor({ state: 'visible', timeout: 5_000 });
		await page.locator('hlm-option').first().click();
	}

	await page.locator('oeb-input').first().locator('input').fill('PDF Test Recipient');
	await page.locator('input[type="email"]').fill('pdf-test-recipient@example.com');
	await page.locator('#issue-badge-btn').click();

	await page.waitForURL(/\/badges\/[^/?#]+/, { timeout: 30_000 });
	await expect(page.getByTestId('badge-title')).toBeVisible();
});
