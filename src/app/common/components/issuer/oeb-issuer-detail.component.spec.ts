import { getByTestId } from '../../../testing/query-helpers';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { OebIssuerDetailComponent } from './oeb-issuer-detail.component';
import { IssuerManager } from '../../../issuer/services/issuer-manager.service';
import { IssuerApiService } from '../../../issuer/services/issuer-api.service';
import { PublicApiService } from '../../../public/services/public-api.service';
import { LearningPathApiService } from '../../../common/services/learningpath-api.service';
import { PDFTemplateManager } from '../../../issuer/services/pdftemplate-manager.service';
import { HlmDialogService } from '../../../components/spartan/ui-dialog-helm/src/lib/hlm-dialog.service';
import { PublicApiIssuer } from '../../../public/models/public-api.model';
import { createCommonProviders } from '../../../testing/common-providers';
import { HttpClientTestingModule } from '@angular/common/http/testing';

export const mockPublicIssuer: PublicApiIssuer = {
	'@context': 'https://w3id.org/openbadges/v2',
	slug: 'test-issuer',
	name: 'Test Institution',
	description: 'A test institution',
	image: '',
	url: 'https://example.com',
	id: 'https://example.com/issuers/test-issuer',
	type: 'Issuer',
};

export const myIssuers$ = new Subject<any[]>();

export async function setupIssuerDetail(
	isLoggedIn: boolean,
	userIsMember: boolean,
): Promise<ComponentFixture<OebIssuerDetailComponent>> {
	await TestBed.configureTestingModule({
		imports: [
			RouterTestingModule,
			OebIssuerDetailComponent,
			TranslateModule.forRoot(),
			HttpClientTestingModule, // 👈 ADD THIS
		],
		providers: [
			...createCommonProviders(isLoggedIn),
			{ provide: IssuerManager, useValue: { myIssuers$: myIssuers$.asObservable() } },
			{ provide: LearningPathApiService, useValue: { getLearningPathsForIssuer: () => Promise.resolve([]) } },
			{ provide: IssuerApiService, useValue: { listSharedNetworkBadges: () => Promise.resolve([]) } },
			{
				provide: PublicApiService,
				useValue: {
					getPublicLearningPaths: () => Promise.resolve([]),
					getIssuerLearningPaths: () => Promise.resolve([]),
				},
			},
			{ provide: PDFTemplateManager, useValue: { pdfEditorAvailable: () => false } },
			{ provide: HlmDialogService, useValue: {} },
		],
	}).compileComponents();

	const fixture = TestBed.createComponent(OebIssuerDetailComponent);
	const component = fixture.componentInstance;

	component.issuer = mockPublicIssuer;
	component.public = true;
	component.networks = [];
	component.partner_issuers = [];
	component.badges = [];

	spyOn<any>(component, 'ngOnInit').and.callFake(async () => {
		component.userIsMember = userIsMember;
	});

	await component.ngOnInit();
	fixture.detectChanges();
	await fixture.whenStable();
	fixture.detectChanges();

	return fixture;
}

describe('OebIssuerDetailComponent — public page button visibility', () => {
	afterEach(() => TestBed.resetTestingModule());

	describe('when user is not a member of the institution', () => {
		it('should show the website button', async () => {
			const fixture = await setupIssuerDetail(false, false);
			expect(getByTestId(fixture, 'website-button')).toBeTruthy();
		});

		it('should not show the member view button', async () => {
			const fixture = await setupIssuerDetail(false, false);
			expect(getByTestId(fixture, 'member-view-button')).toBeFalsy();
		});
	});

	describe('when user is a member of the institution', () => {
		it('should show the website button', async () => {
			const fixture = await setupIssuerDetail(true, true);
			expect(getByTestId(fixture, 'website-button')).toBeTruthy();
		});

		it('should show the member view button', async () => {
			const fixture = await setupIssuerDetail(true, true);
			expect(getByTestId(fixture, 'member-view-button')).toBeTruthy();
		});
	});
});
