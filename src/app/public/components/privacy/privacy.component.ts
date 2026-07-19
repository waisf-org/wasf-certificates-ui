import { Component, OnInit } from '@angular/core';
import { FormMessageComponent } from '../../../common/components/form-message.component';

@Component({
	selector: 'app-privacy',
	templateUrl: './privacy.component.html',
	styleUrls: ['./privacy.component.css'],
	imports: [FormMessageComponent],
})
export class PrivacyComponent implements OnInit {
	// This route (/public/privacy) is unreachable from the app's own nav —
	// the footer's privacy link already points at the real WASF privacy
	// policy (theme.privacyPolicyLink, https://waisf.org/privacy/). But
	// someone could still land here directly, and the template previously
	// rendered the unrelated upstream fork's German privacy policy, which is
	// wrong for both language and organization. Redirect rather than
	// maintain a second, duplicate copy of legal text.
	ngOnInit() {
		window.location.href = 'https://waisf.org/privacy/';
	}
}
