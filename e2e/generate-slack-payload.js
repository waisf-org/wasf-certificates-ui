const fs = require('fs');

const results = JSON.parse(fs.readFileSync('./test-results/results.json', 'utf8'));
const environment = process.env.ENVIRONMENT || 'unknown';
const runUrl = process.env.RUN_URL || '';
const reportUrl = process.env.REPORT_URL || '';

const fileLabels = {
	'badge-participation.spec.ts': 'Participation badges',
	'badge-competency.spec.ts': 'Competency badges',
	'badge-learning-path.spec.ts': 'Learning path badges',
	'badge-edit.spec.ts': 'Badge editing',
};

function getSpecs(suite) {
	return [...(suite.specs || []), ...(suite.suites || []).flatMap(getSpecs)];
}

const allSpecs = results.suites.flatMap(getSpecs);
const failCount = allSpecs.filter((s) => !s.ok).length;
const header =
	failCount === 0
		? `✅ All test cases passed on *${environment}*`
		: `❌ ${failCount} test(s) failed on *${environment}*`;

const lines = [header, ''];

for (const suite of results.suites) {
	const label = fileLabels[suite.title] || suite.title;
	const specs = getSpecs(suite);
	if (!specs.length) continue;
	lines.push(`*${label}*`);
	for (const spec of specs) {
		lines.push(`${spec.ok ? '✅' : '❌'} ${spec.title}`);
	}
	lines.push('');
}

if (reportUrl) {
	lines.push(`<${runUrl}|View run> · <${reportUrl}|View report>`);
} else {
	lines.push(`<${runUrl}|View run & download report>`);
}

fs.writeFileSync('slack-payload.json', JSON.stringify({ text: lines.join('\n') }));
