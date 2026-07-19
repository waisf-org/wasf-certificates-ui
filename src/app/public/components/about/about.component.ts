import { Component, OnInit } from '@angular/core';

@Component({
	selector: 'app-about',
	template: '',
	standalone: true,
})
export class AboutComponent implements OnInit {
	// Previously loaded content from a `cms-page` component keyed by slug
	// 'about-oeb'/'ueber-oeb' — a WordPress-backed CMS proxy (settings.
	// CMS_API_BASE_URL) that is unconfigured (empty) in this fork by default,
	// so it only ever rendered a "not found" placeholder here, not the
	// upstream org's real content. This nav link IS reachable (unlike
	// privacy/terms) — every logged-in member org user sees "About" in the
	// header and could click it. Rather than standing up a WordPress CMS for
	// one static page, redirect to the real WASF About page (which already
	// has real bilingual content — see wasf-website's seed_about_honors.py).
	ngOnInit() {
		window.location.href = 'https://waisf.org/about/';
	}
}
