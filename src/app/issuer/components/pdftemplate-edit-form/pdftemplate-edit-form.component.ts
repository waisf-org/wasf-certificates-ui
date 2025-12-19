import {
	Component,
	EventEmitter,
	Input,
	Output,
	OnInit,
	ViewChild,
	OnChanges,
	SimpleChanges,
	AfterViewInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators, FormsModule, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
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
import { HlmH2, HlmH3, HlmP } from '@spartan-ng/helm/typography';
import { UpperCasePipe } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { StepperComponent } from '../../../components/stepper/stepper.component';
import { StepComponent } from '../../../components/stepper/step.component';
import { CdkStep } from '@angular/cdk/stepper';
import { BgFormFieldImageComponent } from '~/common/components/formfield-image';
import { preloadImageURL, base64ByteSize } from '~/common/util/file-util';
import * as fabric from 'fabric';
import { create } from 'domain';

@Component({
	selector: 'pdftemplate-edit-form',
	templateUrl: './pdftemplate-edit-form.component.html',
	styleUrls: ['./pdftemplate-edit-form.component.scss'],
	imports: [
		FormMessageComponent,
		FormsModule,
		ReactiveFormsModule,
		HlmH2,
		HlmH3,
		HlmP,
		OebInputComponent,
		OebSelectComponent,
		OebCheckboxComponent,
		OebButtonComponent,
		FormFieldRadio,
		FormFieldIconRadio,
		TranslatePipe,
		TranslateModule,
		UpperCasePipe,
		NgIcon,
		HlmIcon,
		StepperComponent,
		StepComponent,
		CdkStep,
		BgFormFieldImageComponent,
	],
})
export class PDFTemplateEditFormComponent
	extends BaseAuthenticatedRoutableComponent
	implements OnInit, OnChanges, AfterViewInit
{
	issuer: Issuer;
	issuerLoaded: Promise<unknown>;
	savePromise: Promise<PDFTemplate> | null = null;

	@ViewChild(StepperComponent) stepper: StepperComponent;

	@ViewChild('imageField')
	imageField: BgFormFieldImageComponent;

	@Input() submittingText: string;

	@Input() pdfTemplate: PDFTemplate;

	@Output()
	save = new EventEmitter<Promise<PDFTemplate>>();

	@Output()
	cancelEdit = new EventEmitter<void>();

	get issuerSlug() {
		return this.route.snapshot.params['issuerSlug'];
	}

	nextStep(): void {
		this.pdfTemplateForm.markTreeDirtyAndValidate();
		this.stepper.next();
	}

	previousStep(): void {
		this.stepper.previous();
	}

	lastStep(): boolean {
		return this.stepper?.selectedIndex == this.stepper?.steps.length - 1;
	}

	firstStep(): boolean {
		return this.stepper?.selectedIndex == 0;
	}

	cancelClicked() {
		this.cancelEdit.emit();
	}

	allowedFileFormats = ['image/png', 'image/svg+xml', 'image/jpeg'];
	readonly pdfPreviewOEBDesignImageUrl = preloadImageURL('../../../../breakdown/static/images/pdfPreviewOEBDesign.svg');
	maxImageSize = 1024 * 1024 * 2;
	isImageLarge = false;
	currentImage;

	protected canvas?: fabric.Canvas;
	protected canvasTextBlock?: fabric.Group;
	pdfOrigWidth: number;
	pdfOrigHeight: number;
	pdfOrigBlockWidth: number;
	pdfTextColor: string = '#323232';
	pdfLinkColor: string = '#1400FF';
	pdfGreyBgColor: string = '#F5F5F5';
	canvasDiffXDecimal: number;
	canvasDiffYDecimal: number;

	readonly pdfPreviewQrImageUrl = preloadImageURL('../../../../breakdown/static/images/pdfPreviewQrImage.png');
	readonly pdfPreviewBadgeImageSVGUrl = preloadImageURL('../../../../breakdown/static/images/pdfPreviewBadgeImage.svg');

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

	ngOnChanges(changes: SimpleChanges) {
		if (changes['pdfTemplate'] && changes['pdfTemplate'].currentValue) {
			this.initFormFromExisting(this.pdfTemplate);
		}
	}

	ngOnInit() {
		if (!this.pdfTemplate) {
			// restore values from sessionStorage for new pdf templates
			const sessionValuesJSON = sessionStorage.getItem('oeb-create-pdftemplatevalues');
			if (sessionValuesJSON) {
				const sessionValues = JSON.parse(sessionValuesJSON);
				this.pdfTemplateForm.rawControl.patchValue({
					name: sessionValues['pdftemplate_name'] || '',
					format: sessionValues['pdftemplate_format'] || false,
					alignment: sessionValues['pdftemplate_alignment'] || 0 as PDFTemplateAlignment,
					posX: sessionValues['pdftemplate_posX'] || 80,
					posY: sessionValues['pdftemplate_posY'] || 98,
					scale: sessionValues['pdftemplate_scale'] || 90,
				});
			}
			// save name, format & alignment to sessionStorage on Change
			this.pdfTemplateForm.rawControl.valueChanges.subscribe((v) => {
				let saveableSessionValues = {};
				for (const [k, v] of Object.entries(this.pdfTemplateForm.rawControl.value)) {
					if (['name', 'format', 'alignment', 'posX', 'posY', 'scale'].includes(k)) {
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

	ngAfterViewInit(): void {
		this.stepper.selectionChange.subscribe((event) => {
			if (typeof this.canvas === 'undefined' && event.selectedIndex == 1) {
				setTimeout(() =>{
					this.initCanvas()
				}, 1);
			}
		});

		this.pdfTemplateForm.rawControl.valueChanges.subscribe((v) => {
			this.recalcCanvas();
		});
	}

	initCanvas() {
		if (this.pdfTemplateForm.value.format == '0') {
			this.pdfOrigWidth = fabric.util.parseUnit('210mm');
			this.pdfOrigHeight = fabric.util.parseUnit('297mm');
			this.pdfOrigBlockWidth = fabric.util.parseUnit('103mm');
		} else {
			this.pdfOrigWidth = fabric.util.parseUnit('297mm');
			this.pdfOrigHeight = fabric.util.parseUnit('210mm');
			this.pdfOrigBlockWidth = fabric.util.parseUnit('193mm');
		}

		this.canvasDiffXDecimal = 0;
		this.canvasDiffYDecimal = 0;

		this.canvas = new fabric.Canvas('previewCanvas');

		const bgImg = document.querySelector<HTMLImageElement>('#backgroundImage');
		let img = new fabric.FabricImage(bgImg, {
			scaleX: this.canvas.width / bgImg.width,
			scaleY: this.canvas.height / bgImg.height,
		});
		this.canvas.backgroundImage = img;

		this.recalcCanvas();
	}

	recalcCanvas() {
		this.canvas.remove(this.canvasTextBlock);

		const widthCoeff = this.canvas.width / this.pdfOrigWidth;
		const heightCoeff = this.canvas.height / this.pdfOrigHeight;
		// const heightCoeff = this.pdfOrigHeight / this.canvas.height;
		const scaleCoeff = this.pdfTemplateForm.value.scale / 100;

		const blockWidth = this.pdfOrigBlockWidth * widthCoeff * scaleCoeff;
		const blockLeft = this.pdfTemplateForm.value.posX * widthCoeff;
		const blockTop = this.pdfTemplateForm.value.posY * heightCoeff;
		const blockAlignment = this.pdfTemplateForm.value.alignment == '0' ? 'left' : 'center';

		let internalBlockY = blockTop;

		const name = new fabric.Textbox('Vorname Nachname', {
			fontSize: 16 * heightCoeff * scaleCoeff,
			fontFamily: 'Rubik',
			fontWeight: 700,
			lineHeight: 1.2,
			textAlign: blockAlignment,
			fill: this.pdfTextColor,
			top: internalBlockY,
			left: blockLeft,
			width: blockWidth
		});
		internalBlockY += name.height;
		internalBlockY += 8 * heightCoeff * scaleCoeff;

		const date = new fabric.Textbox('hat vom DD.MM.-DD.MM.YYYY in Ort', {
			fontSize: 14 * heightCoeff * scaleCoeff,
			fontFamily: 'Rubik',
			lineHeight: 1.3,
			textAlign: blockAlignment,
			fill: this.pdfTextColor,
			top: internalBlockY,
			left: blockLeft,
			width: blockWidth
		});
		date.setSelectionStyles({ fontWeight: 500 }, 8, 25);
		date.setSelectionStyles({ fontWeight: 500 }, 29, 32);
		internalBlockY += date.height;

		const hours = new fabric.Textbox('innerhalb von XX Stunden', {
			fontSize: 14 * heightCoeff * scaleCoeff,
			fontFamily: 'Rubik',
			lineHeight: 1.3,
			textAlign: blockAlignment,
			fill: this.pdfTextColor,
			top: internalBlockY,
			left: blockLeft,
			width: blockWidth
		});
		hours.setSelectionStyles({ fontWeight: 500 }, 14, 24);
		internalBlockY += hours.height;

		const aquired = new fabric.Textbox('folgenden Badge erworben:', {
			fontSize: 14 * heightCoeff * scaleCoeff,
			fontFamily: 'Rubik',
			lineHeight: 1.3,
			textAlign: blockAlignment,
			fill: this.pdfTextColor,
			top: internalBlockY,
			left: blockLeft,
			width: blockWidth
		});
		internalBlockY += aquired.height;
		internalBlockY += 32 * heightCoeff * scaleCoeff;

		const badgeImg = document.querySelector<HTMLImageElement>('#badgeImageSVG');
		badgeImg.width = 160;
		badgeImg.height = 160;
		const badge = new fabric.FabricImage(badgeImg, {
			scaleX: heightCoeff * scaleCoeff,
			scaleY: heightCoeff * scaleCoeff,
			top: internalBlockY,
		});
		const imgCenterPos = blockLeft + (blockWidth - badge.width * heightCoeff * scaleCoeff)/2;
		badge.left = blockAlignment == 'center' ? imgCenterPos : blockLeft;

		internalBlockY += badge.height * heightCoeff * scaleCoeff;
		internalBlockY += 24 * heightCoeff * scaleCoeff;

		const title = new fabric.Textbox('Badge Titel maximal 60 Zeichen stehen hier zB A New Road for', {
			fontSize: 16 * heightCoeff * scaleCoeff,
			fontFamily: 'Rubik',
			fontWeight: 700,
			lineHeight: 1.2,
			textAlign: blockAlignment,
			fill: this.pdfTextColor,
			top: internalBlockY,
			left: blockLeft,
			width: blockWidth
		});
		internalBlockY += title.height;
		internalBlockY += 8 * heightCoeff * scaleCoeff;

		const desc = new fabric.Textbox('Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis,  ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate  eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae,  justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt.  Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend  tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac,  enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus', {
			fontSize: 12 * heightCoeff * scaleCoeff,
			fontFamily: 'Rubik',
			lineHeight: 1.3,
			textAlign: blockAlignment,
			fill: this.pdfTextColor,
			top: internalBlockY,
			left: blockLeft,
			width: blockWidth,
		});
		internalBlockY += desc.height;
		internalBlockY += 24 * heightCoeff * scaleCoeff;

		const rect = new fabric.Rect({
			rx: 5,
			ry: 5,
			fill: this.pdfGreyBgColor,
			top: internalBlockY,
			left: blockLeft,
			width: blockWidth,
			height: 58 * heightCoeff * scaleCoeff,
		});

		const qrImg = document.querySelector<HTMLImageElement>('#qrImage');
		qrImg.width = 50;
		qrImg.height = 50;
		const qr = new fabric.FabricImage(qrImg, {
			scaleX: heightCoeff * scaleCoeff,
			scaleY: heightCoeff * scaleCoeff,
			top: internalBlockY + 4 * heightCoeff * scaleCoeff,
			left: blockLeft + 4 * widthCoeff * scaleCoeff,
		});

		const created = new fabric.Textbox('ERSTELLT ÜBER OPENBADGES.EDUCATION.', {
			fontSize: 10 * heightCoeff * scaleCoeff,
			fontFamily: 'Rubik',
			fontWeight: 700,
			lineHeight: 1.3,
			fill: this.pdfTextColor,
			top: internalBlockY + 9.5 * heightCoeff * scaleCoeff,
			left: blockLeft + 59 * widthCoeff * scaleCoeff,
			width: blockWidth - 59 * widthCoeff * scaleCoeff,
		});
		created.setSelectionStyles({
			fill: this.pdfLinkColor,
			underline: true
		}, 14, 34);

		const digital = new fabric.Textbox('Der digitale Badge kann über den QR-Code abgerufen werden.', {
			fontSize: 10 * heightCoeff * scaleCoeff,
			fontFamily: 'Rubik',
			lineHeight: 1.3,
			fill: this.pdfTextColor,
			top: internalBlockY + 9.5 * heightCoeff * scaleCoeff + created.height,
			left: blockLeft + 59 * widthCoeff * scaleCoeff,
			width: blockWidth - 59 * widthCoeff * scaleCoeff,
		});


		this.canvasTextBlock = new fabric.Group([
			name, date, hours, aquired, badge, title, desc, rect, qr, created, digital
		], {
			width: blockWidth,
			borderColor: '#FF4849',
			borderDashArray: [3],
			hasBorders: true,
			hasControls: false
		});

		this.canvas.add(this.canvasTextBlock);

		this.canvas.setActiveObject(this.canvasTextBlock);
		this.canvas.on('selection:cleared', () => {
			this.canvas.setActiveObject(this.canvasTextBlock);
		});

		this.canvasTextBlock.on('moving', (e) => {
			const diffX = (e.e as MouseEvent).movementX / widthCoeff + this.canvasDiffXDecimal;
			const diffY = (e.e as MouseEvent).movementY / heightCoeff + this.canvasDiffYDecimal;

			this.canvasDiffXDecimal = diffX - Math.round(diffX);
			this.canvasDiffYDecimal = diffY - Math.round(diffY);

			const newPosX = Number(this.pdfTemplateForm.value.posX) + Math.round(diffX);
			const newPosY = Number(this.pdfTemplateForm.value.posY) + Math.round(diffY);

			// if (this.coordsInsideCanvas(newPosX, newPosY)) {
				this.pdfTemplateForm.rawControl.controls.posX.setValue(newPosX, {
					emitEvent: false
				});
				this.pdfTemplateForm.rawControl.controls.posY.setValue(newPosY, {
					emitEvent: false
				});
			// }

			// this.canvasValidation();
		});
	}

	coordsInsideCanvas(x, y): boolean {
		if (x < 0 || y < 0) {
			return false;
		}

		return true;
	}

	// isTextBlockCompletelyOnCanvas(): boolean {
	// 	if (this.canvasTextBlock.aCoords.tl.x < 0 ||
	// 		this.canvasTextBlock.aCoords.tl.y < 0 ||
	// 		this.canvas.getWidth() - this.canvasTextBlock.aCoords.br.x < 0 ||
	// 		this.canvas.getHeight() - this.canvasTextBlock.aCoords.br.y < 0
	// 	) {
	// 		return false;
	// 	}

	// 	return true;
	// }

	initFormFromExisting(pt: PDFTemplate) {
		if (!pt) return;

		this.pdfTemplateForm.setValue({
			name: pt.name,
			format: pt.format.toString(),
			alignment: pt.alignment.toString(),
			posX: pt.posX,
			posY: pt.posY,
			scale: pt.scale,
			image: pt.image,
		});
	}

	positiveIntegerOrNull() {
		return (control: AbstractControl) => {
			const val = parseFloat(control.value);

			if (isNaN(val)) {
				return { emptyField: this.translate.instant('OEBComponents.fieldIsRequired') };
			}
			if (!Number.isInteger(val) || val < 0) {
				return { negativeDuration: this.translate.instant('CreateBadge.durationPositive') };
			}
		}
	}

	imageValidation(): ValidationErrors | null {
		if (!this.pdfTemplateForm) return null;

		const value = this.pdfTemplateForm.value;

		const image = (value.image || '').trim();

		if (!image.length) {
			return { imageRequired: true };
		} else {
			const permittedDiscrepancy = 0.01;
			let ratioA4 = 210 / 297;
			if (Number(value.format)) {
				ratioA4 = 297 / 210;
			}

			let img = new Image();
			img.src = image;

			const imgRatio = img.width / img.height;
			if (ratioA4 - permittedDiscrepancy > imgRatio || ratioA4 + permittedDiscrepancy < imgRatio) {
				return { imageRatioFalse: true };
			}
		}
	}

	canvasValidation(): ValidationErrors | null {
		if (!this.pdfTemplateForm) return null;
		if (!this.canvas) return null;
		if (!this.canvasTextBlock) return null;

		if (this.canvasTextBlock.aCoords.tl.x < 0 ||
			this.canvasTextBlock.aCoords.tl.y < 0 ||
			this.canvas.getWidth() - this.canvasTextBlock.aCoords.br.x < 0 ||
			this.canvas.getHeight() - this.canvasTextBlock.aCoords.br.y < 0
		) {
			return { textBlockOutside: true };
		}
	}

	test() {
		return (control: AbstractControl) => {

			if (!this.pdfTemplateForm) return null;
			if (!this.canvas) return null;
			if (!this.canvasTextBlock) return null;

			const x = parseFloat(control.value);
			if (x < 0 || this.canvas.getWidth() - this.canvasTextBlock.aCoords.br.x < 0) {
				return { textBlockOutside: true };
			}

			// if (this.canvasTextBlock.aCoords.tl.x < 0 ||
			// 	this.canvasTextBlock.aCoords.tl.y < 0 ||
			// 	this.canvas.getWidth() - this.canvasTextBlock.aCoords.br.x < 0 ||
			// 	this.canvas.getHeight() - this.canvasTextBlock.aCoords.br.y < 0
			// ) {
			// 	return { textBlockOutside: true };
			// }
			// return { textBlockOutside: true };

		}
	}

	pdfTemplateForm = typedFormGroup([
		this.imageValidation.bind(this),
		// this.canvasValidation.bind(this),
	])
		.addControl('name', '', [Validators.required, Validators.maxLength(60)])
		.addControl('format', "0", Validators.required)
		.addControl('alignment', "0", Validators.required)
		.addControl('posX', 80, [this.positiveIntegerOrNull(), this.test()])
		.addControl('posY', 98, this.positiveIntegerOrNull)
		.addControl('scale', 90, [this.positiveIntegerOrNull(), Validators.min(83), Validators.max(100)])
		.addControl('image', '');

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

			if (this.pdfTemplate) {
				this.pdfTemplate.name = formState.name;
				this.pdfTemplate.format = Number(formState.format) as PDFTemplateFormat;
				this.pdfTemplate.alignment = Number(formState.alignment) as PDFTemplateAlignment;
				this.pdfTemplate.posX = formState.posX;
				this.pdfTemplate.posY = formState.posY;
				this.pdfTemplate.scale = formState.scale;
				this.pdfTemplate.image = formState.image;

				this.savePromise = this.pdfTemplate.save();
			} else {
				let pdfTemplateData = {
					issuer_id: this.issuer.slug,
					name: formState.name,
					format: Number(formState.format) as PDFTemplateFormat,
					alignment: Number(formState.alignment) as PDFTemplateAlignment,
					posX: formState.posX,
					posY: formState.posY,
					scale: formState.scale,
					image: formState.image,
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

	get imageFieldDirty() {
		return this.pdfTemplateForm.controls.image.dirty;
	}

	validateFields(fields: string[]) {
		return fields.every((c) => {
			return this.pdfTemplateForm.controls[c].valid;
		});
	}

	dirtyFields(fields: string[]) {
		return fields.every((c) => {
			return this.pdfTemplateForm.controls[c].dirty;
		});
	}

	generateUploadImage(image) {
		if (base64ByteSize(image) > this.maxImageSize) {
			this.isImageLarge = true;
			return;
		}
		this.currentImage = image.slice();
		this.imageField.useDataUrl(image, 'PDFTEMPLATE');
	}
}
