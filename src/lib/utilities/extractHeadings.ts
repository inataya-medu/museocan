import GithubSlugger from 'github-slugger';

export type Heading = {
	depth: 2 | 3;
	text: string;
	id: string;
};

export function extractHeadings(rawMarkdown: string): Heading[] {
	const slugger = new GithubSlugger();
	const headings: Heading[] = [];

	for (const line of rawMarkdown.split('\n')) {
		const h2 = line.match(/^## (.+)/);
		const h3 = line.match(/^### (.+)/);
		const match = h2 ?? h3;
		if (!match) continue;

		const depth = h2 ? 2 : 3;
		const text = match[1].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`^~]/g, '').trim();
		headings.push({ depth: depth as 2 | 3, text, id: slugger.slug(text) });
	}

	return headings;
}
