import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { OebDialogComponent } from '../../../components/oeb-dialog.component';
import { OebButtonComponent } from '../../../components/oeb-button.component';
import { OebInputComponent } from '../../../components/input.component';
import { HlmP, HlmH3 } from '../../../components/spartan/ui-typography-helm/src';
import { UserProfileApiService } from '../../services/user-profile-api.service';
import { typedFormGroup } from '../../util/typed-forms';

@Component({
	selector: 'disable-two-factor-dialog',
	imports: [OebDialogComponent, OebButtonComponent, OebInputComponent, HlmP, HlmH3, FormsModule, ReactiveFormsModule],
	template: `
		<oeb-dialog class="tw-text-oebblack">
			<h3 hlmH3 class="tw-font-bold !tw-text-black tw-uppercase tw-mb-2">
				2FA deaktivieren
			</h3>
			<p hlmP class="tw-mb-4">
				Bitte gib dein Passwort und den aktuellen Authenticator-Code ein, um die 2-Faktor-Authentifizierung zu
				deaktivieren.
			</p>

			<form [formGroup]="disableForm.rawControl" (ngSubmit)="submit()" novalidate>
				<oeb-input
					[control]="disableForm.rawControlMap.password"
					label="Passwort"
					[fieldType]="'password'"
					[autofocus]="true"
					errorMessage="Bitte gib dein Passwort ein."
				></oeb-input>
				<oeb-input
					[control]="disableForm.rawControlMap.code"
					label="Authenticator-Code"
					errorMessage="Bitte gib deinen Code ein."
				></oeb-input>

				@if (errorMessage) {
					<p hlmP class="tw-text-red-600 tw-text-sm tw-mt-2">{{ errorMessage }}</p>
				}

				<div class="tw-flex tw-justify-between tw-gap-2 tw-mt-6">
					<oeb-button variant="secondary" type="button" text="Abbrechen" (click)="cancel()"></oeb-button>
					<oeb-button type="submit" width="max_content" [disabled]="isLoading" text="Deaktivieren"></oeb-button>
				</div>
			</form>
		</oeb-dialog>
	`,
})
export class DisableTwoFactorDialogComponent {
	private readonly _dialogRef = inject<BrnDialogRef>(BrnDialogRef);
	private readonly _context = injectBrnDialogContext<{ onDisabled: () => void }>();
	private profileApiService = inject(UserProfileApiService);

	disableForm = typedFormGroup()
		.addControl('password', '', [Validators.required])
		.addControl('code', '', [Validators.required]);

	errorMessage = '';
	isLoading = false;

	/** Inserted by Angular inject() migration for backwards compatibility */
	constructor(...args: unknown[]);
	constructor() {}

	submit() {
		if (!this.disableForm.markTreeDirtyAndValidate()) return;

		this.isLoading = true;
		this.errorMessage = '';

		this.profileApiService
			.disable2FA(this.disableForm.value.password, this.disableForm.value.code)
			.then(() => {
				this._context.onDisabled();
				this._dialogRef.close('disabled');
			})
			.catch((err) => {
				try {
					const body = JSON.parse(err.message);
					this.errorMessage = body?.error || 'Ein Fehler ist aufgetreten.';
				} catch {
					this.errorMessage = 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
				}
			})
			.finally(() => {
				this.isLoading = false;
			});
	}

	cancel() {
		this._dialogRef.close('cancel');
	}
}
