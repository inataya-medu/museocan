import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

import { loadPublishedPosts } from '$lib/utilities/loadPublishedPosts';
import { loadPublishedCours } from '$lib/utilities/loadPublishedCours';
import { loadZoteroTaggedPublications } from '$lib/utilities/loadZoteroPublications';
import { getTagSummaries, tagToSlug, type TagSummary } from '$lib/utilities/tags';

const hasTag = (tags: string[], selectedTag: string): boolean =>
	tags.some((value) => tagToSlug(value) === selectedTag);

const listByTag = <TItem>(items: TItem[], getTags: (item: TItem) => string[], selectedTag: string): TItem[] =>
	items.filter((item) => hasTag(getTags(item), selectedTag));

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

export const load: PageServerLoad = async ({ params, fetch }) => {
	const [allPosts, allCours] = await Promise.all([loadPublishedPosts(), loadPublishedCours()]);
	const postTagSummaries = mergeTagSummaries(getTagSummaries(allPosts), getTagSummaries(allCours));

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

	const BLOG_RESOURCE = listByTag(allPosts, (post) => post.metadata.tags, params.tag).map((post) => ({
		slug: post.slug,
		baseRoute: '/blog' as const,
		title: post.metadata.title,
		date: post.metadata.date,
		readingTime: post.metadata.readingTime,
		tags: post.metadata.tags
	}));

	const COURS_RESOURCE = listByTag(allCours, (post) => post.metadata.tags, params.tag).map((post) => ({
		slug: post.slug,
		baseRoute: '/cours' as const,
		title: post.metadata.title,
		date: post.metadata.date,
		readingTime: post.metadata.readingTime,
		tags: post.metadata.tags
	}));

	const PUBLICATIONS_RESOURCE = taggedPublications.map((publication, index) => ({
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
		posts: BLOG_RESOURCE,
		cours: COURS_RESOURCE,
		publications: PUBLICATIONS_RESOURCE,
		metadata: {
			title: `Tag: ${tag.name}`,
			description: `Ressources associées au tag ${tag.name}`
		}
	};
};
