import { test, expect } from '@playwright/test';
import { urls, uniqueName, createBadge, advanceToSubmit } from '../helpers/badge';

test('copies a competency badge and saves it with a new name', async ({ page }) => {
	const sourceName = uniqueName('Datenschutz Grundlagen');
	await createBadge(page, 'competency', sourceName, 'de');
	test.info().annotations.push({ type: 'badge-url', description: page.url() });

	// Open the overflow menu on the badge detail page
	await page.locator('.overflow-menu button').first().click();

	// Click the copy menu item — text is "Kopieren (diese Institution)" (DE) or "Copy (this institution)" (EN)
	const copyItem = page
		.locator('[hlmmenuitem]')
		.filter({ hasText: /kopieren|copy/i })
		.first();
	await copyItem.waitFor({ state: 'visible', timeout: 5_000 });
	await copyItem.click();

	// The create form opens pre-filled with the source badge's data
	await page.waitForURL(/\/badges\/create\/competency/, { timeout: 15_000 });
	const form = page.locator('badgeclass-edit-form');
	await form.waitFor({ state: 'visible', timeout: 10_000 });

	// Wait for the name field to be pre-filled, then replace it
	const nameInput = form.locator('input[type="text"]').first();
	await expect(nameInput).not.toHaveValue('', { timeout: 10_000 });
	const copyName = uniqueName('Datenschutz Grundlagen Kopie');
	await nameInput.click({ clickCount: 3 });
	await nameInput.fill(copyName);
	await expect(nameInput).toHaveValue(copyName);

	await advanceToSubmit(page);
	await page.waitForURL(/\/badges\/[^/?#]+$/, { timeout: 30_000 });
	test.info().annotations.push({ type: 'badge-url', description: page.url() });
	await expect(page.getByTestId('badge-title')).toContainText(copyName);
});
