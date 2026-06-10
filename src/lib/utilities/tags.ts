export type TagSummary = {
	tag: string;
	slug: string;
	count: number;
};

export const tagToSlug = (tag: string): string =>
	tag
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

export const normalizeTags = (value: unknown): string[] => {
	const parseStringTags = (input: string): string[] => {
		const trimmed = input.trim();
		if (!trimmed) return [];

		// Supports YAML-like list strings: "- item1\n- item2"
		if (trimmed.includes('\n')) {
			return trimmed
				.split(/\r?\n/)
				.map((line) => line.replace(/^\s*-\s*/, '').trim())
				.filter(Boolean);
		}

		return trimmed.split(',');
	};

	const rawTags = Array.isArray(value)
		? value
		: typeof value === 'string'
			? parseStringTags(value)
			: [];

	const uniqueBySlug = new Map<string, string>();

	for (const rawTag of rawTags) {
		if (typeof rawTag !== 'string') continue;

		const cleanedTag = rawTag.trim();
		if (!cleanedTag) continue;

		const slug = tagToSlug(cleanedTag);
		if (!slug || uniqueBySlug.has(slug)) continue;

		uniqueBySlug.set(slug, cleanedTag);
	}

	return Array.from(uniqueBySlug.values());
};

export const getTagSummaries = (posts: Array<{ metadata: { tags?: string[] } }>): TagSummary[] => {
	const bySlug = new Map<string, TagSummary>();

	for (const post of posts) {
		for (const tag of post.metadata.tags ?? []) {
			const slug = tagToSlug(tag);
			if (!slug) continue;

			const current = bySlug.get(slug);
			if (current) {
				current.count += 1;
			} else {
				bySlug.set(slug, { tag, slug, count: 1 });
			}
		}
	}

	return Array.from(bySlug.values()).sort((a, b) => a.tag.localeCompare(b.tag, 'fr'));
};
