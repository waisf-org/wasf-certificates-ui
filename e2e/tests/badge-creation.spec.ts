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
	await page.waitForURL(/\/badges\/[^/?#]+/, { timeout: 30_000 });
	await expect(page).toHaveURL(/\/badges\/[^/?#]+/);
});

test('creates a competency badge', async ({ page }) => {
	await page.goto(urls.badgeCreate('competency'));
	await fillStep1(page, uniqueName('Competency'));
	await clickNext(page); // details → competencies step

	// Add one competency by hand
	const trigger = page.locator('#competencies-by-hand-section');
	if (await trigger.isVisible()) {
		await trigger.click();
	}
	await page.locator('#add-competency-btn').waitFor({ state: 'visible', timeout: 5_000 });
	await page.locator('#add-competency-btn').click();
	await page.locator('oeb-input[id="competencyTitle_0"] input').waitFor({ state: 'visible', timeout: 5_000 });
	await page.locator('oeb-input[id="competencyTitle_0"] input').fill('Testkompetenz');
	await page.locator('oeb-input[id="competencyDescriptionInput_0"] textarea').fill('E2E test competency description');
	await page.locator('brn-select[id="competencyCategory_0"] button').click();
	await page.locator('hlm-option').first().waitFor({ state: 'visible', timeout: 5_000 });
	await page.locator('hlm-option').first().click();

	await advanceToSubmit(page);
	await page.waitForURL(/\/badges\/[^/?#]+/, { timeout: 30_000 });
	await expect(page).toHaveURL(/\/badges\/[^/?#]+/);
});

test('creates a learning path badge', async ({ page }) => {
	await page.goto(urls.learningPathCreate());

	// Step 1: details
	const form = page.locator('learningpath-edit-form');
	await form.locator('input[type="text"]').first().fill(uniqueName('LearningPath'));
	await form.locator('textarea').first().fill('Automated E2E test learning path');
	await selectIconFromLibrary(page);

	const lpNext = () => page.getByTestId('lp-next-btn').locator('button');

	// Step 1 → step 2 (badge selection)
	await lpNext().click();

	// Step 2: select the first 2 available badges
	const checkboxes = page.locator('bg-badgecard button[role="checkbox"]');
	await checkboxes.first().waitFor({ state: 'visible', timeout: 15_000 });
	await checkboxes.nth(0).click();
	await page.waitForTimeout(300);
	await checkboxes.nth(1).click();
	await page.waitForTimeout(300);

	// Step 2 → step 3 (sequence)
	await lpNext().click();
	await page.waitForTimeout(600);

	// Step 3 → step 4 (finishing)
	await lpNext().click();
	await page.waitForTimeout(600);

	// Submit
	const lpSubmit = page.getByTestId('lp-submit-btn').locator('button');
	await lpSubmit.waitFor({ state: 'visible', timeout: 10_000 });
	await lpSubmit.click();
	await page.waitForURL(/\/learningpaths\/[^/?#]+$/, { timeout: 30_000 });
	await expect(page).toHaveURL(/\/learningpaths\/[^/?#]+$/);
});
