import {
	Component,
	EventEmitter,
	Input,
	Output,
	OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BaseAuthenticatedRoutableComponent } from '../../../common/pages/base-authenticated-routable.component';
import { SessionService } from '../../../common/services/session.service';
import { typedFormGroup } from '../../../common/util/typed-forms';
import { PDFTemplateAlignment, PDFTemplateFormat, ApiPDFTemplateForCreation } from '../../../common/model/pdftemplate-api.model';
import { PDFTemplate, pdfTemplateAlignments, pdfTemplateFormats } from '../../models/pdftemplate.model';
import { TranslateService, TranslatePipe, TranslateModule } from '@ngx-translate/core';
import { PDFTemplateManager } from '../../services/pdftemplate-manager.service';
import { Issuer } from '../../models/issuer.model';
import { IssuerManager } from '../../services/issuer-manager.service';
import { FormMessageComponent } from '../../../common/components/form-message.component';
import { OebInputComponent } from '../../../components/input.component';
import { OebSelectComponent } from '../../../components/select.component';
import { OebCheckboxComponent } from '../../../components/oeb-checkbox.component';
import { OebButtonComponent } from '../../../components/oeb-button.component';

import { FormFieldSelectOption } from '../../../common/components/formfield-select';
import { FormFieldRadio } from '../../../common/components/formfield-radio';
import { FormFieldIconRadio } from '../../../common/components/formfield-icon-radio';

import { HlmH2 } from '@spartan-ng/helm/typography';
import { UpperCasePipe } from '@angular/common';

@Component({
	selector: 'pdftemplate-edit-form',
	templateUrl: './pdftemplate-edit-form.component.html',
	styleUrls: ['./pdftemplate-edit-form.component.scss'],
	imports: [
		FormMessageComponent,
		FormsModule,
		ReactiveFormsModule,
		HlmH2,
		OebInputComponent,
		OebSelectComponent,
		OebCheckboxComponent,
		OebButtonComponent,
		FormFieldRadio,
		FormFieldIconRadio,
		TranslatePipe,
		TranslateModule,
		UpperCasePipe,
	],
})
export class PDFTemplateEditFormComponent
	extends BaseAuthenticatedRoutableComponent
	implements OnInit
{
	issuer: Issuer;
	issuerLoaded: Promise<unknown>;

	@Input()
	submittingText: string;

	@Input() pdfTemplate: PDFTemplate;

	@Output()
	save = new EventEmitter<Promise<PDFTemplate>>();

	@Output()
	cancelEdit = new EventEmitter<void>();

	get issuerSlug() {
		return this.route.snapshot.params['issuerSlug'];
	}

	cancelClicked() {
		this.cancelEdit.emit();
	}

	constructor(
		protected loginService: SessionService,
		protected router: Router,
		protected route: ActivatedRoute,
		private translate: TranslateService,
		protected issuerManager: IssuerManager,
		protected pdfTemplateManager: PDFTemplateManager,
	) {
		super(router, route, loginService);
		this.issuerLoaded = this.issuerManager.issuerBySlug(this.issuerSlug).then((issuer) => {
			this.issuer = issuer;
		});
	}

	ngOnInit() {
		if (!this.existingPDFTemplate) {
			// restore values from sessionStorage for new pdf templates
			const sessionValuesJSON = sessionStorage.getItem('oeb-create-pdftemplatevalues');
			if (sessionValuesJSON) {
				const sessionValues = JSON.parse(sessionValuesJSON);
				this.pdfTemplateForm.rawControl.patchValue({
					name: sessionValues['pdftemplate_name'] || '',
					format: sessionValues['pdftemplate_format'] || false,
					alignment: sessionValues['pdftemplate_alignment'] || 0 as PDFTemplateAlignment,
				});
			}
			// save name, format & alignment to sessionStorage on Change
			this.pdfTemplateForm.rawControl.valueChanges.subscribe((v) => {
				let saveableSessionValues = {};
				for (const [k, v] of Object.entries(this.pdfTemplateForm.rawControl.value)) {
					if (['name', 'format', 'alignment'].includes(k)) {
						saveableSessionValues['pdftemplate_' + k] = v;
					}
				}
				sessionStorage.setItem('oeb-create-pdftemplatevalues', JSON.stringify(saveableSessionValues));
			});
		} else {
			// clear session storage when editing existing pdf templates
			sessionStorage.removeItem('oeb-create-pdftemplatevalues');
		}
	}

	savePromise: Promise<PDFTemplate> | null = null;

	pdfTemplateForm = typedFormGroup()
		.addControl('name', '', [Validators.required, Validators.maxLength(60)])
		.addControl('format', "0", Validators.required)
		.addControl('alignment', "0", Validators.required);

	existingPDFTemplate: PDFTemplate | null = null;

	readonly formatOptions: FormFieldSelectOption[] = pdfTemplateFormats.map((r) => ({
		label: r.label,
		value: r.value,
	}));

	readonly alignmentOptions: FormFieldSelectOption[] = pdfTemplateAlignments.map((r) => ({
		label: r.label,
		value: r.value,
		icon: r.icon,
	}));

	async onSubmit() {
		try {
			this.pdfTemplateForm.markTreeDirty();
			const formState = this.pdfTemplateForm.value;

			if (this.existingPDFTemplate) {
				this.existingPDFTemplate.name = formState.name;
				this.existingPDFTemplate.format = Number(formState.format) as PDFTemplateFormat;
				this.existingPDFTemplate.alignment = Number(formState.alignment) as PDFTemplateAlignment;

				this.savePromise = this.existingPDFTemplate.save();
			} else {
				let pdfTemplateData = {
					issuer_id: this.issuer.slug,
					name: formState.name,
					format: Number(formState.format) as PDFTemplateFormat,
					alignment: Number(formState.alignment) as PDFTemplateAlignment,
				} as ApiPDFTemplateForCreation;

				this.savePromise = this.pdfTemplateManager.createPDFTemplate(this.issuerSlug, pdfTemplateData)
			}

			this.save.emit(this.savePromise);

			// clear sessionStorage
			sessionStorage.removeItem('oeb-create-pdftemplatevalues');
		} catch (e) {
			console.log(e);
		}
	}
}
