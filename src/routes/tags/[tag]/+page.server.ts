import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

import { loadPublishedPosts } from '$lib/utilities/loadPublishedPosts';
import { loadZoteroTaggedPublications } from '$lib/utilities/loadZoteroPublications';
import { getTagSummaries, tagToSlug } from '$lib/utilities/tags';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const allPosts = await loadPublishedPosts();
	const postTagSummaries = getTagSummaries(allPosts);

	let taggedPublications: Awaited<ReturnType<typeof loadZoteroTaggedPublications>> = [];
	let publicationTagSummaries: ReturnType<typeof getTagSummaries> = [];

	try {
		const allPublications = await loadZoteroTaggedPublications(fetch);
		taggedPublications = allPublications.filter((publication) =>
			publication.tags.some((tag) => tagToSlug(tag) === params.tag)
		);
		publicationTagSummaries = getTagSummaries(
			allPublications.map((publication) => ({ metadata: { tags: publication.tags } }))
		);
	} catch (caught) {
		console.warn('Unable to load Zotero publications for tag page:', caught);
		taggedPublications = [];
		publicationTagSummaries = [];
	}

	const currentPostTag = postTagSummaries.find((tag) => tag.slug === params.tag);
	const currentPublicationTag = publicationTagSummaries.find((tag) => tag.slug === params.tag);

	if (!currentPostTag && !currentPublicationTag) {
		throw error(404, 'Tag introuvable');
	}

	const tag = {
		name: currentPostTag?.tag || currentPublicationTag?.tag || params.tag,
		slug: params.tag,
		postCount: currentPostTag?.count ?? 0,
		publicationCount: currentPublicationTag?.count ?? 0
	};

	const posts = allPosts
		.filter((post) => post.metadata.tags.some((value) => tagToSlug(value) === params.tag))
		.map((post) => ({
			slug: post.slug,
			title: post.metadata.title,
			date: post.metadata.date,
			readingTime: post.metadata.readingTime,
			tags: post.metadata.tags
		}));

	const publications = taggedPublications.map((publication, index) => ({
		key: publication.zoteroUrl || `${params.tag}-${index}`,
		title: publication.title,
		formattedCitation: publication.formattedCitation,
		itemType: 'document',
		date: publication.date,
		parsedDate: publication.parsedDate,
		creators: [],
		tags: publication.tags,
		detailFields: [],
		zoteroUrl: publication.zoteroUrl
	} satisfies ZoteroPublication));

	return {
		tag,
		posts,
		publications,
		metadata: {
			title: `Tag: ${tag.name}`,
			description: `Billets et publications associés au tag ${tag.name}`
		}
	};
};
