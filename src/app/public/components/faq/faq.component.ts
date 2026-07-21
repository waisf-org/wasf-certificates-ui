import { Component, OnInit } from '@angular/core';

@Component({
	selector: 'app-faq',
	template: '',
	standalone: true,
})
export class FaqComponent implements OnInit {
	// Same unconfigured WordPress CMS proxy issue as about/start — redirect to
	// the WASF homepage instead (no dedicated FAQ page exists there yet).
	ngOnInit() {
		window.location.href = 'https://waisf.org/';
	}
}
