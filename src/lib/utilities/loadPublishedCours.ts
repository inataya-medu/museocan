import type { Component } from 'svelte';
import { error } from '@sveltejs/kit';

import { isPost } from '$lib/utilities/isPost';
import { normalizePostDate } from '$lib/utilities/dates';
import { getReadingTime } from '$lib/utilities/readingTime';
import { slugFromPath } from '$lib/utilities/slugFromPath';
import { normalizeTags } from '$lib/utilities/tags';
import { extractHeadings } from '$lib/utilities/extractHeadings';

export type LoadedPost = {
	slug: string;
	component: Component;
	metadata: Posts & {
		date: string;
		readingTime: number;
		tags: string[];
		headings: Heading[];
	};
};

// Public API
const loadPublishedCours = async (): Promise<LoadedPost[]> => {
	const modules = import.meta.glob('/src/content/cours/*.{md,svx,svelte.md}');
	const rawModules = import.meta.glob('/src/content/cours/*.{md,svx,svelte.md}', {
		query: '?raw',
		import: 'default'
	}) as Record<string, () => Promise<string>>;
	const entries = Object.entries(modules);

	const loaded = await Promise.all(
		entries.map(async ([path, resolver]): Promise<LoadedPost | null> => {
			const pathSlug = slugFromPath(path);
			if (!pathSlug) {
				throw error(500, `Invalid post path: ${path}`);
			}

			const rawResolver = rawModules[path];
			if (!rawResolver) {
				throw error(500, `Missing raw module resolver for post: ${path}`);
			}

			const module = await resolver();
			const rawContent = await rawResolver();
			const mdsvexPost = module as {
				default: Component;
				metadata: Record<string, unknown>;
			};

			const frontmatter = mdsvexPost.metadata as Partial<Posts>;

			if (!isPost(frontmatter)) {
				throw error(500, `Invalid metadata shape for post: ${pathSlug}`);
			}

			if (!frontmatter.published) return null;

			const normalizedDate = normalizePostDate(frontmatter.date);
			if (!normalizedDate) {
				throw error(500, `Invalid metadata date format for: ${frontmatter.slug ?? pathSlug}`);
			}

			const resolvedSlug = frontmatter.slug?.trim() || pathSlug;
			const readingTime = getReadingTime(rawContent);
			const headings = extractHeadings(rawContent);

			return {
				slug: resolvedSlug,
				component: mdsvexPost.default,
				metadata: {
					...frontmatter,
					slug: resolvedSlug,
					date: normalizedDate,
					readingTime,
					tags: normalizeTags(mdsvexPost.metadata.tags),
					headings
				}
			};
		})
	);

	const publishedPosts = loaded.filter((post): post is LoadedPost => post !== null);
	const seenSlugs = new Set<string>();

	for (const post of publishedPosts) {
		if (seenSlugs.has(post.slug)) {
			throw error(500, `Duplicate post slug detected: ${post.slug}`);
		}

		seenSlugs.add(post.slug);
	}

	return publishedPosts.toSorted(byPostDateDesc);
};

export { loadPublishedCours, loadPublishedCours as loadPublishedPosts };

const byPostDateDesc = <T extends { metadata: { date: string } }>(a: T, b: T) =>
	b.metadata.date.localeCompare(a.metadata.date);
