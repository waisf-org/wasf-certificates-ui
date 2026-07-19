import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseRoutableComponent } from '../../../common/pages/base-routable.component';

@Component({
	selector: 'app-terms',
	templateUrl: './terms-of-service.component.html',
	styleUrls: ['./terms-of-service.component.css'],
})
export class TermsComponent extends BaseRoutableComponent implements OnInit {
	/** Inserted by Angular inject() migration for backwards compatibility */
	constructor(...args: unknown[]);

	constructor() {
		const router = inject(Router);
		const route = inject(ActivatedRoute);

		super(router, route);
	}

	ngOnInit() {
		// This route (/public/terms-of-service) is unreachable from the app's
		// own nav — the footer's terms link already points at the real WASF
		// terms of service (theme.termsOfServiceLink, https://waisf.org/terms/).
		// But someone could still land here directly, and the template
		// previously rendered the unrelated upstream fork's German terms of
		// service, which is wrong for both language and organization. Redirect
		// rather than maintain a second, duplicate copy of legal text.
		window.location.href = 'https://waisf.org/terms/';
	}
}
