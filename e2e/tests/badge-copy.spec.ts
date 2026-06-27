import { test, expect } from '@playwright/test';
import { urls, uniqueName, createBadge, advanceToSubmit, selectIconFromLibrary } from '../helpers/badge';

test('copies a competency badge and saves it with a new name', async ({ page }) => {
	const sourceName = uniqueName('Datenschutz Grundlagen');
	await createBadge(page, 'competency', sourceName, 'de');
	test.info().annotations.push({ type: 'badge-url', description: page.url() });

	// Open the overflow menu (the trigger is a single button inside oeb-dropdown.overflow-menu)
	const menuTrigger = page.locator('oeb-dropdown.overflow-menu').locator('button').first();
	await menuTrigger.waitFor({ state: 'visible', timeout: 10_000 });
	await menuTrigger.click();

	// Click the copy menu item — portal-rendered, text "Kopieren (diese Institution)" (DE) or similar
	const copyItem = page.getByRole('menuitem').filter({ hasText: /kopieren|copy/i }).first();
	await copyItem.waitFor({ state: 'visible', timeout: 5_000 });
	await copyItem.click();

	// If the account has multiple issuers, an issuer-selection dialog opens first.
	// Select the first radio (current issuer) and confirm.
	const issuerDialog = page.locator('[role="dialog"]');
	const dialogVisible = await issuerDialog.isVisible({ timeout: 3_000 }).catch(() => false);
	if (dialogVisible) {
		await issuerDialog.locator('input[type="radio"]').first().click();
		await issuerDialog.locator('oeb-button').locator('button').click();
	}

	// copyBadge() navigates to /badges/create (no type suffix — type comes from copybadgeid state)
	await page.waitForURL(/\/badges\/create/, { timeout: 15_000 });
	const form = page.locator('badgeclass-edit-form');
	await form.waitFor({ state: 'visible', timeout: 10_000 });

	// Wait for the name field to be pre-filled, then replace it
	const nameInput = form.locator('input[type="text"]').first();
	await expect(nameInput).not.toHaveValue('', { timeout: 10_000 });
	const copyName = uniqueName('Datenschutz Grundlagen Kopie');
	await nameInput.click({ clickCount: 3 });
	await nameInput.fill(copyName);
	await expect(nameInput).toHaveValue(copyName);

	// Upload the test image — same as createBadge does — so imageValidation() passes
	// and the CDK linear stepper allows advancing past the details step.
	await selectIconFromLibrary(page);
	await advanceToSubmit(page);
	await page.waitForURL(/\/badges\/[^/?#]+$/, { timeout: 30_000 });
	test.info().annotations.push({ type: 'badge-url', description: page.url() });
	await expect(page.getByTestId('badge-title')).toContainText(copyName);
});
