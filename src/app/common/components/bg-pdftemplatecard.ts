import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PDFTemplateApiService } from '../services/pdftemplate-api.service';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { BgImageStatusPlaceholderDirective } from '../directives/bg-image-status-placeholder.directive';
import { TranslatePipe } from '@ngx-translate/core';
import { HlmP } from '@spartan-ng/helm/typography';

@Component({
	selector: 'bg-pdftemplatecard',
	host: {
		class: 'tw-rounded-[10px] tw-h-full tw-bg-white tw-border-purple tw-border tw-border-solid tw-relative tw-p-4 tw-block tw-overflow-hidden oeb-badge-card',
	},
	template: `
		<div class="tw-flex tw-flex-col tw-justify-between tw-h-full">
			<div class="tw-bg-[var(--color-lightgray)] tw-w-full tw-relative tw-h-[153.08px] tw-items-center tw-flex tw-justify-center tw-p-2 tw-rounded-[3px]">
				<img
					class="tw-w-[96.82px] tw-h-[137.08px]"
					[loaded-src]="pdftemplateImage"
					[loading-src]="pdfTemplateFailedImageUrl"
					[error-src]="pdfTemplateFailedImageUrl"
					width="97"
				/>
			</div>
			<div class="tw-flex tw-flex-col tw-text-oebblack tw-mt-4 tw-gap-2">
				<span class="tw-font-bold tw-text-[16px] tw-leading-[16.8px] oeb-break-words">{{ name }}</span>

				<div class="tw-flex tw-flex-col">
					<span class="tw-uppercase tw-text-[10px] tw-leading-[12px] tw-text-purple">{{ 'Issuer.createdOn' | translate }} {{ created_at }}</span>
					<span class="tw-text-[10px] tw-leading-[12px] tw-text-purple">{{ 'General.of' | translate }} Vorname Nachname</span>
				</div>

				<div class="tw-flex tw-justify-between tw-items-center">
					<a (click)="openEditDialog()" class="tw-cursor-pointer tw-text-[10px] tw-leading-[12px] tw-underline">Bearbeiten</a>
					<ng-icon hlm name="lucideTrash2" />
				</div>
			</div>
		</div>
	`,
	imports: [
		RouterLink,
		NgIcon,
		BgImageStatusPlaceholderDirective,
		HlmP,
		TranslatePipe,
	],
})
export class BgPDFTemplateCard {
	readonly pdfTemplateFailedImageUrl = '../../../breakdown/static/images/image-failed.svg';

	constructor(private pdfTemplateApiService: PDFTemplateApiService) {}

	@Input() slug: string;
	@Input() issuerSlug: string;
	@Input() name: string;
	@Input() created_at: string;
	@Input() created_by: string;
	@Input() pdftemplateImage: string;

	@Output() edit = new EventEmitter();

	openEditDialog() {
		this.edit.emit();
	}
}
