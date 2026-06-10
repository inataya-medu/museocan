import type { PageServerLoad } from './$types';

import { loadPublishedPosts } from '$lib/utilities/loadPublishedPosts';
import { loadPublishedCours } from '$lib/utilities/loadPublishedCours';
import { loadZoteroTaggedPublications } from '$lib/utilities/loadZoteroPublications';
import { getTagSummaries, type TagSummary } from '$lib/utilities/tags';

const mergeTagSummaries = (...groups: TagSummary[][]): TagSummary[] => {
	const bySlug = new Map<string, TagSummary>();

	for (const group of groups) {
		for (const summary of group) {
			const current = bySlug.get(summary.slug);
			if (current) {
				current.count += summary.count;
			} else {
				bySlug.set(summary.slug, { ...summary });
			}
		}
	}

	return Array.from(bySlug.values()).sort((a, b) => a.tag.localeCompare(b.tag, 'fr'));
};

export const load: PageServerLoad = async ({ fetch }) => {
	const [posts, cours] = await Promise.all([loadPublishedPosts(), loadPublishedCours()]);
	const postTags = mergeTagSummaries(getTagSummaries(posts), getTagSummaries(cours));

	let publicationTags: ReturnType<typeof getTagSummaries> = [];
	try {
		const publications = await loadZoteroTaggedPublications(fetch);
		publicationTags = getTagSummaries(
			publications.map((publication) => ({ metadata: { tags: publication.tags } }))
		);
	} catch (caught) {
		console.warn('Unable to load Zotero publication tags:', caught);
		publicationTags = [];
	}

	return {
		postTags,
		publicationTags,
		metadata: {
			title: 'Tags',
			description: 'Index des tags des billets et des publications'
		}
	};
};
