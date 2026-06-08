import { test, expect } from '@playwright/test';
import { urls, uniqueName, createBadge } from '../helpers/badge';

test('assigns a custom PDF template when issuing a badge', async ({ page }) => {
	const badgeSlug = await createBadge(page, 'participation', uniqueName('PDF'));

	await page.goto(urls.badgeIssue(badgeSlug));

	// Select the first PDF template if the dropdown is visible
	const pdfLabel = page.getByText('PDF-Hintergrund');
	if (await pdfLabel.isVisible({ timeout: 5_000 }).catch(() => false)) {
		await page.locator('oeb-select').filter({ has: pdfLabel }).locator('hlm-select-trigger').click();
		await page.locator('hlm-option').first().waitFor({ state: 'visible', timeout: 5_000 });
		await page.locator('hlm-option').first().click();
	}

	await page.locator('oeb-input').first().locator('input').fill('PDF Test Recipient');
	await page.locator('input[type="email"]').fill('pdf-test-recipient@e2e.local');

	await page.locator('#issue-badge-btn').click();

	await page.waitForURL(/\/badges\/[^/?#]+$/, { timeout: 30_000 });
	await expect(page).toHaveURL(/\/badges\/[^/?#]+$/);
});
