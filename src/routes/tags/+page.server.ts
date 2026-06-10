import type { PageServerLoad } from './$types';

import { loadPublishedPosts } from '$lib/utilities/loadPublishedPosts';
import { loadZoteroTaggedPublications } from '$lib/utilities/loadZoteroPublications';
import { getTagSummaries } from '$lib/utilities/tags';

export const load: PageServerLoad = async ({ fetch }) => {
	const posts = await loadPublishedPosts();
	const postTags = getTagSummaries(posts);

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
