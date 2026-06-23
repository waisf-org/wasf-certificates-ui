import { test, expect } from '@playwright/test';
import { urls, uniqueName, createBadge, selectIconFromLibrary, advanceToSubmit } from '../helpers/badge';

test('edits badge image using the icon library', async ({ page }) => {
	const badgeSlug = await createBadge(page, 'participation', uniqueName('Edit'));

	await page.goto(urls.badgeEdit(badgeSlug));
	await selectIconFromLibrary(page);
	await advanceToSubmit(page);

	await page.waitForURL(/\/badges\/[^/?#]+/, { timeout: 30_000 });
	await expect(page).toHaveURL(/\/badges\/[^/?#]+/);
});
