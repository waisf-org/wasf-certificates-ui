import { test, expect, Page } from '@playwright/test';
import { urls, uniqueName, selectIconFromLibrary, clickNext, advanceToSubmit } from '../helpers/badge';

async function fillStep1(page: Page, name: string) {
	const form = page.locator('badgeclass-edit-form');
	await form.locator('input[type="text"]').first().fill(name);
	await form.locator('#badgeclass_description_input textarea').fill('Automated E2E test badge');
	await selectIconFromLibrary(page);
}

test('creates a participation badge', async ({ page }) => {
	await page.goto(urls.badgeCreate('participation'));
	await fillStep1(page, uniqueName('Participation'));
	await advanceToSubmit(page);
	await page.waitForURL(/\/badges\/[^/?#]+$/, { timeout: 30_000 });
	await expect(page).toHaveURL(/\/badges\/[^/?#]+$/);
});

test('creates a competency badge', async ({ page }) => {
	await page.goto(urls.badgeCreate('competency'));
	await fillStep1(page, uniqueName('Competency'));
	await clickNext(page); // details → competencies step

	// Add one competency by hand
	const trigger = page.locator('#competencies-by-hand-section');
	if (await trigger.isVisible()) {
		await trigger.click();
		await page.waitForTimeout(300);
	}
	await page.locator('#add-competency-btn').waitFor({ state: 'visible', timeout: 5_000 });
	await page.locator('#add-competency-btn').click();
	await page.waitForTimeout(300);
	await page.locator('oeb-input[id="competencyTitle_0"] input').fill('Testkompetenz');
	await page.locator('oeb-select[id="competencyCategory_0"] hlm-select-trigger').click();
	await page.locator('hlm-option').first().waitFor({ state: 'visible', timeout: 5_000 });
	await page.locator('hlm-option').first().click();

	await advanceToSubmit(page);
	await page.waitForURL(/\/badges\/[^/?#]+$/, { timeout: 30_000 });
	await expect(page).toHaveURL(/\/badges\/[^/?#]+$/);
});

test('creates a learning path badge', async ({ page }) => {
	await page.goto(urls.badgeCreate('learningpath'));
	await fillStep1(page, uniqueName('LearningPath'));
	await advanceToSubmit(page);
	await page.waitForURL(/\/badges\/[^/?#]+$/, { timeout: 30_000 });
	await expect(page).toHaveURL(/\/badges\/[^/?#]+$/);
});
