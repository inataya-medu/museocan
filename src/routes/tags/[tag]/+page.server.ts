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
	const contentTagSummaries = mergeTagSummaries(getTagSummaries(allPosts), getTagSummaries(allCours));

	let publicationItems: Awaited<ReturnType<typeof loadZoteroTaggedPublications>> = [];
	let publicationTagSummaries: ReturnType<typeof getTagSummaries> = [];
	let publicationsUnavailable = false;

	try {
		const allPublications = await loadZoteroTaggedPublications(fetch);
		publicationItems = allPublications.filter((publication) =>
			publication.tags.some((tag) => tagToSlug(tag) === params.tag)
		);
		publicationTagSummaries = getTagSummaries(
			allPublications.map((publication) => ({ metadata: { tags: publication.tags } }))
		);
	} catch (caught) {
		console.warn('Unable to load Zotero publications for tag page:', caught);
		publicationItems = [];
		publicationTagSummaries = [];
		publicationsUnavailable = true;
	}

	const currentContentTag = contentTagSummaries.find((tag) => tag.slug === params.tag);
	const currentPublicationTag = publicationTagSummaries.find((tag) => tag.slug === params.tag);

	if (!currentContentTag && !currentPublicationTag && !publicationsUnavailable) {
		throw error(404, 'Tag introuvable');
	}

	const tag = {
		name: currentContentTag?.tag || currentPublicationTag?.tag || params.tag,
		slug: params.tag,
		postCount: currentContentTag?.count ?? 0,
		publicationCount: currentPublicationTag?.count ?? 0
	};

	const blogResources = listByTag(allPosts, (post) => post.metadata.tags, params.tag).map((post) => ({
		slug: post.slug,
		baseRoute: '/blog' as const,
		title: post.metadata.title,
		date: post.metadata.date,
		readingTime: post.metadata.readingTime,
		tags: post.metadata.tags
	}));

	const coursResources = listByTag(allCours, (post) => post.metadata.tags, params.tag).map((post) => ({
		slug: post.slug,
		baseRoute: '/cours' as const,
		title: post.metadata.title,
		date: post.metadata.date,
		readingTime: post.metadata.readingTime,
		tags: post.metadata.tags
	}));

	const publicationResources = publicationItems.map((publication, index) => ({
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
		posts: blogResources,
		cours: coursResources,
		publications: publicationResources,
		metadata: {
			title: `Tag: ${tag.name}`,
			description: `Ressources associées au tag ${tag.name}`
		}
	};
};
