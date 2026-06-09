import { Component, inject } from '@angular/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { OebDialogComponent } from '../../../components/oeb-dialog.component';
import { OebButtonComponent } from '../../../components/oeb-button.component';
import { HlmP, HlmH3 } from '../../../components/spartan/ui-typography-helm/src';

@Component({
	selector: 'mfa-reminder-dialog',
	imports: [OebDialogComponent, OebButtonComponent, HlmP, HlmH3],
	template: `
		<oeb-dialog class="tw-text-center tw-text-oebblack">
			<h3 hlmH3 class="tw-font-bold !tw-text-black tw-uppercase tw-mb-2">
				2-Faktor-Authentifizierung
			</h3>
			<p hlmP class="tw-mb-6">
				Schütze dein Konto mit der 2-Faktor-Authentifizierung. Nach der Einrichtung benötigst du beim Login
				zusätzlich einen Code aus deiner Authenticator-App.
			</p>
			<div class="tw-flex tw-flex-col tw-gap-3">
				<oeb-button width="full_width" text="Jetzt 2FA einrichten" (click)="setupNow()"></oeb-button>
				<oeb-button width="full_width" variant="secondary" text="Später erinnern" (click)="remindLater()"></oeb-button>
				<oeb-button width="full_width" variant="secondary" text="Nicht mehr erinnern" (click)="neverRemind()"></oeb-button>
			</div>
		</oeb-dialog>
	`,
})
export class MfaReminderDialogComponent {
	private readonly _dialogRef = inject<BrnDialogRef>(BrnDialogRef);
	private readonly _context = injectBrnDialogContext<{ onNeverRemind: () => void }>();

	/** Inserted by Angular inject() migration for backwards compatibility */
	constructor(...args: unknown[]);
	constructor() {}

	setupNow() {
		window.open('/profile/2fa', '_blank');
		this._dialogRef.close('setup');
	}

	remindLater() {
		this._dialogRef.close('later');
	}

	neverRemind() {
		this._context.onNeverRemind();
		this._dialogRef.close('never');
	}
}
