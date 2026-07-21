import { Component, OnInit } from '@angular/core';

@Component({
	selector: 'app-start',
	template: '',
	standalone: true,
})
export class StartComponent implements OnInit {
	// Previously loaded content from a `cms-page` component (slug
	// 'homepage'/'startseite') — same unconfigured WordPress CMS proxy issue
	// as about.component.ts, so it only ever showed a "not found" placeholder.
	// Redirect to the real WASF homepage instead of standing up a CMS for this.
	ngOnInit() {
		window.location.href = 'https://waisf.org/';
	}
}
